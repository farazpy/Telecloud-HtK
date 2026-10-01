#!/usr/bin/env python3
"""
TeleCloud - Telegram MTProto Storage Engine using Telethon
High-performance asynchronous MTProto file storage bridge.
"""

import os
import sys
import json
import asyncio
import mimetypes
import logging
from typing import Optional, Dict, Any
from pathlib import Path

from aiohttp import web
from telethon import TelegramClient, utils
from telethon.sessions import StringSession
from telethon.tl.types import (
    DocumentAttributeFilename,
    DocumentAttributeVideo,
    DocumentAttributeAudio,
    MessageMediaDocument,
    MessageMediaPhoto,
)
from telethon.errors import (
    SessionPasswordNeededError,
    PhoneCodeInvalidError,
    PhoneNumberInvalidError,
    PhoneCodeExpiredError,
    PhoneNumberBannedError,
    FloodWaitError,
    ApiIdInvalidError,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("telethon_storage")

DATA_DIR = Path("./data")
DATA_DIR.mkdir(parents=True, exist_ok=True)
CONFIG_FILE = DATA_DIR / "config.json"

class TelethonManager:
    def __init__(self):
        self.client: Optional[TelegramClient] = None
        self.api_id: Optional[int] = None
        self.api_hash: Optional[str] = None
        self.session_str: Optional[str] = None
        self.storage_chat: str = "me"
        self.pending_phone: Optional[str] = None
        self.pending_phone_code_hash: Optional[str] = None
        self.active_user: Optional[Dict[str, Any]] = None
        self.is_connected = False
        self.load_config()

    def load_config(self):
        env_id = os.environ.get("TELEGRAM_API_ID")
        env_hash = os.environ.get("TELEGRAM_API_HASH")
        if env_id:
            try:
                self.api_id = int(env_id)
            except ValueError:
                pass
        if env_hash:
            self.api_hash = env_hash.strip()

        if CONFIG_FILE.exists():
            try:
                with open(CONFIG_FILE, "r") as f:
                    cfg = json.load(f)
                    self.api_id = cfg.get("api_id") or self.api_id
                    self.api_hash = cfg.get("api_hash") or self.api_hash
                    self.session_str = cfg.get("session_str")
                    self.storage_chat = cfg.get("storage_chat", "me")
            except Exception as e:
                logger.error(f"Error loading config: {e}")

    def save_config(self):
        try:
            with open(CONFIG_FILE, "w") as f:
                json.dump({
                    "api_id": self.api_id,
                    "api_hash": self.api_hash,
                    "session_str": self.session_str,
                    "storage_chat": self.storage_chat
                }, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving config: {e}")

    async def ensure_connected(self):
        """
        Guarantees the TelegramClient is connected and bound to the CURRENT active asyncio event loop.
        If the event loop changed (e.g. server reload or loop switch), smoothly re-initializes on the active loop.
        """
        try:
            current_loop = asyncio.get_running_loop()
        except RuntimeError:
            current_loop = None

        if self.client and current_loop and getattr(self.client, "loop", None) != current_loop:
            logger.warning("Event loop mismatch detected on TelegramClient. Re-binding to active event loop...")
            self.client = None
            self.is_connected = False

        if (not self.client or not self.is_connected) and self.api_id and self.api_hash and self.session_str:
            await self.init_saved_client()

    async def init_saved_client(self):
        if self.api_id and self.api_hash and self.session_str:
            try:
                try:
                    current_loop = asyncio.get_running_loop()
                except RuntimeError:
                    current_loop = None

                logger.info("Initializing saved Telegram client session on active loop...")
                self.client = TelegramClient(StringSession(self.session_str), self.api_id, self.api_hash, loop=current_loop)
                await self.client.connect()
                if await self.client.is_user_authorized():
                    self.is_connected = True
                    me = await self.client.get_me()
                    self.active_user = {
                        "id": me.id,
                        "first_name": getattr(me, "first_name", ""),
                        "last_name": getattr(me, "last_name", ""),
                        "username": getattr(me, "username", ""),
                        "is_bot": getattr(me, "bot", False),
                        "phone": getattr(me, "phone", "")
                    }
                    logger.info(f"Authorized as: {self.active_user.get('first_name')} (@{self.active_user.get('username')})")
                else:
                    self.is_connected = False
                    logger.warning("Saved session is not authorized.")
            except Exception as e:
                logger.error(f"Failed to auto-connect with saved session: {e}")
                self.is_connected = False

    async def connect_bot(self, api_id: int, api_hash: str, bot_token: str, storage_chat: str = "me"):
        try:
            if self.client:
                try:
                    await self.client.disconnect()
                except Exception:
                    pass
            
            try:
                current_loop = asyncio.get_running_loop()
            except RuntimeError:
                current_loop = None

            session = StringSession()
            client = TelegramClient(session, api_id, api_hash, loop=current_loop)
            await client.start(bot_token=bot_token)
            
            me = await client.get_me()
            self.client = client
            self.api_id = api_id
            self.api_hash = api_hash
            self.session_str = session.save()
            self.storage_chat = storage_chat
            self.is_connected = True
            self.active_user = {
                "id": me.id,
                "first_name": getattr(me, "first_name", "Bot"),
                "username": getattr(me, "username", ""),
                "is_bot": True
            }
            self.save_config()
            return {"success": True, "user": self.active_user}
        except Exception as e:
            logger.error(f"Error connecting bot: {e}")
            raise e

    async def connect_session_string(self, api_id: int, api_hash: str, session_str: str, storage_chat: str = "me"):
        try:
            if self.client:
                try:
                    await self.client.disconnect()
                except Exception:
                    pass

            try:
                current_loop = asyncio.get_running_loop()
            except RuntimeError:
                current_loop = None

            client = TelegramClient(StringSession(session_str), api_id, api_hash, loop=current_loop)
            await client.connect()
            if not await client.is_user_authorized():
                raise ValueError("Session string is invalid or expired.")

            me = await client.get_me()
            self.client = client
            self.api_id = api_id
            self.api_hash = api_hash
            self.session_str = session_str
            self.storage_chat = storage_chat
            self.is_connected = True
            self.active_user = {
                "id": me.id,
                "first_name": getattr(me, "first_name", ""),
                "last_name": getattr(me, "last_name", ""),
                "username": getattr(me, "username", ""),
                "is_bot": getattr(me, "bot", False),
                "phone": getattr(me, "phone", "")
            }
            self.save_config()
            return {"success": True, "user": self.active_user}
        except Exception as e:
            logger.error(f"Error connecting session string: {e}")
            raise e

    async def send_code_request(self, api_id: int, api_hash: str, phone: str, storage_chat: str = "me"):
        try:
            phone_clean = phone.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
            if not phone_clean.startswith("+"):
                phone_clean = "+" + phone_clean

            if self.client:
                try:
                    await self.client.disconnect()
                except Exception:
                    pass

            try:
                current_loop = asyncio.get_running_loop()
            except RuntimeError:
                current_loop = None

            session = StringSession()
            client = TelegramClient(session, api_id, api_hash, loop=current_loop)
            await client.connect()
            
            res = await client.send_code_request(phone_clean)
            self.client = client
            self.api_id = api_id
            self.api_hash = api_hash
            self.pending_phone = phone_clean
            self.pending_phone_code_hash = res.phone_code_hash
            self.storage_chat = storage_chat
            return {
                "success": True,
                "phone_code_hash": res.phone_code_hash,
                "timeout": getattr(res, "timeout", None)
            }
        except PhoneNumberInvalidError:
            raise ValueError(f"Invalid phone number format '{phone}'. Please check your country code and digits.")
        except PhoneNumberBannedError:
            raise ValueError(f"The phone number '{phone}' has been banned by Telegram.")
        except FloodWaitError as e:
            raise ValueError(f"Telegram rate limit: please wait {e.seconds} seconds before requesting a code again.")
        except ApiIdInvalidError:
            raise ValueError("Invalid Telegram API ID or API Hash configuration.")
        except Exception as e:
            logger.error(f"Error sending code: {e}")
            raise ValueError(str(e))

    async def sign_in_code(self, phone: str, code: str, phone_code_hash: str, password: Optional[str] = None):
        await self.ensure_connected()
        if not self.client:
            if self.api_id and self.api_hash and self.session_str:
                try:
                    current_loop = asyncio.get_running_loop()
                except RuntimeError:
                    current_loop = None
                self.client = TelegramClient(StringSession(self.session_str), self.api_id, self.api_hash, loop=current_loop)
                await self.client.connect()
            else:
                raise ValueError("No active Telegram connection. Please request verification code first.")
        
        try:
            phone_clean = phone.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
            if not phone_clean.startswith("+"):
                phone_clean = "+" + phone_clean
            code_clean = code.strip().replace(" ", "")

            try:
                await self.client.sign_in(phone=phone_clean, code=code_clean, phone_code_hash=phone_code_hash)
            except SessionPasswordNeededError:
                if not password:
                    return {"requires_password": True, "message": "Two-factor authentication (2FA) password required."}
                await self.client.sign_in(password=password)

            me = await self.client.get_me()
            self.session_str = self.client.session.save()
            self.is_connected = True
            self.active_user = {
                "id": me.id,
                "first_name": getattr(me, "first_name", ""),
                "last_name": getattr(me, "last_name", ""),
                "username": getattr(me, "username", ""),
                "is_bot": getattr(me, "bot", False),
                "phone": getattr(me, "phone", "")
            }
            self.save_config()
            return {"success": True, "user": self.active_user}
        except PhoneCodeInvalidError:
            raise ValueError("Invalid verification code. Please check the code in your Telegram app and try again.")
        except PhoneCodeExpiredError:
            raise ValueError("Verification code expired. Please request a new code.")
        except SessionPasswordNeededError:
            return {"requires_password": True, "message": "Two-factor authentication (2FA) password required."}
        except FloodWaitError as e:
            raise ValueError(f"Telegram rate limit: please wait {e.seconds} seconds.")
        except Exception as e:
            logger.error(f"Error signing in: {e}")
            raise ValueError(str(e))

    async def list_dialogs(self):
        await self.ensure_connected()
        dialogs = [{
            "id": "me",
            "title": "Self (Saved Messages)",
            "type": "self",
            "is_self": True,
            "badge": "Private & Default",
            "description": "Your personal Telegram Saved Messages chat"
        }]
        if not self.client or not self.is_connected:
            return dialogs

        try:
            async for d in self.client.iter_dialogs(limit=30):
                if d.is_channel or d.is_group:
                    cid = str(d.id)
                    dialogs.append({
                        "id": cid,
                        "title": d.title,
                        "type": "channel" if d.is_channel else "group",
                        "is_self": False,
                        "badge": "Storage Channel" if d.is_channel else "Group Chat",
                        "description": f"ID: {cid}"
                    })
        except Exception as e:
            logger.warning(f"Error fetching dialogs: {e}")

        return dialogs

    async def disconnect(self):
        try:
            if self.client:
                await self.client.disconnect()
            self.client = None
            self.is_connected = False
            self.active_user = None
            self.session_str = None
            self.save_config()
            return {"success": True}
        except Exception as e:
            logger.error(f"Error during disconnect: {e}")
            raise e

    async def get_target_entity(self):
        await self.ensure_connected()
        if not self.client:
            raise ValueError("Telegram client not connected.")
        target = self.storage_chat.strip() if self.storage_chat else "me"
        if target.lower() in ("me", "saved", "saved messages"):
            return "me"
        # Check if integer ID
        try:
            int_id = int(target)
            return await self.client.get_entity(int_id)
        except ValueError:
            return await self.client.get_entity(target)

    async def upload_file(self, file_path: str, original_filename: str, caption: Optional[str] = None):
        await self.ensure_connected()
        if not self.client or not self.is_connected:
            raise ValueError("Telegram client is not connected.")

        entity = await self.get_target_entity()
        file_path_obj = Path(file_path)
        if not file_path_obj.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        file_size = file_path_obj.stat().st_size
        mime, _ = mimetypes.guess_type(original_filename)
        mime = mime or "application/octet-stream"

        logger.info(f"Uploading file '{original_filename}' ({file_size} bytes) to MTProto chat '{self.storage_chat}'...")

        msg = await self.client.send_file(
            entity,
            file_path,
            caption=caption or f"📂 {original_filename}\nSize: {round(file_size / (1024*1024), 2)} MB",
            force_document=True,
            attributes=[DocumentAttributeFilename(original_filename)]
        )

        chat_id_str = str(getattr(entity, "id", "me"))
        return {
            "success": True,
            "message_id": msg.id,
            "chat_id": chat_id_str,
            "file_name": original_filename,
            "file_size": file_size,
            "mime_type": mime,
            "date": msg.date.isoformat() if msg.date else None,
            "caption": caption
        }

    async def list_files(self, limit: int = 50):
        await self.ensure_connected()
        if not self.client or not self.is_connected:
            return []

        entity = await self.get_target_entity()
        messages = await self.client.get_messages(entity, limit=limit)
        files = []

        for msg in messages:
            if not msg.media:
                continue

            file_name = "unknown"
            file_size = 0
            mime_type = "application/octet-stream"

            if isinstance(msg.media, MessageMediaDocument) and msg.media.document:
                doc = msg.media.document
                file_size = doc.size
                mime_type = doc.mime_type
                for attr in doc.attributes:
                    if isinstance(attr, DocumentAttributeFilename):
                        file_name = attr.file_name
                        break
                    elif isinstance(attr, DocumentAttributeVideo):
                        file_name = f"video_{msg.id}.mp4"
                    elif isinstance(attr, DocumentAttributeAudio):
                        file_name = f"audio_{msg.id}.mp3"
                if file_name == "unknown":
                    ext = mimetypes.guess_extension(mime_type) or ".bin"
                    file_name = f"file_{msg.id}{ext}"
            elif isinstance(msg.media, MessageMediaPhoto):
                file_name = f"photo_{msg.id}.jpg"
                mime_type = "image/jpeg"
                file_size = 0

            files.append({
                "message_id": msg.id,
                "file_name": file_name,
                "file_size": file_size,
                "mime_type": mime_type,
                "caption": msg.text or "",
                "date": msg.date.isoformat() if msg.date else None
            })

        return files

    async def delete_file(self, message_id: int):
        await self.ensure_connected()
        if not self.client or not self.is_connected:
            raise ValueError("Telegram client not connected.")
        entity = await self.get_target_entity()
        await self.client.delete_messages(entity, [message_id])
        return {"success": True}

manager = TelethonManager()

# --- HTTP Routes ---

async def handle_status(request: web.Request):
    return web.json_response({
        "connected": manager.is_connected,
        "user": manager.active_user,
        "storage_chat": manager.storage_chat,
        "has_session": bool(manager.session_str),
        "api_id": manager.api_id,
        "api_hash": manager.api_hash
    })

async def handle_connect(request: web.Request):
    try:
        data = await request.json()
        api_id = int(data.get("api_id") or manager.api_id)
        api_hash = str(data.get("api_hash") or manager.api_hash).strip()
        bot_token = data.get("bot_token")
        string_session = data.get("string_session")
        storage_chat = data.get("storage_chat", manager.storage_chat or "me")

        if bot_token and bot_token.strip():
            res = await manager.connect_bot(api_id, api_hash, bot_token.strip(), storage_chat)
            return web.json_response(res)
        elif string_session and string_session.strip():
            res = await manager.connect_session_string(api_id, api_hash, string_session.strip(), storage_chat)
            return web.json_response(res)
        else:
            return web.json_response({"error": "Provide either bot_token or string_session, or use phone login."}, status=400)
    except Exception as e:
        logger.exception("Error in handle_connect")
        return web.json_response({"error": str(e)}, status=500)

async def handle_send_code(request: web.Request):
    try:
        data = await request.json()
        api_id = int(data.get("api_id") or manager.api_id or 27254692)
        api_hash = str(data.get("api_hash") or manager.api_hash or "9f6f826a62b78378292fd224e943cb65").strip()
        phone = str(data.get("phone", "")).strip()
        storage_chat = data.get("storage_chat", manager.storage_chat or "me")

        if not phone:
            return web.json_response({"error": "Phone number is required."}, status=400)

        res = await manager.send_code_request(api_id, api_hash, phone, storage_chat)
        return web.json_response(res)
    except Exception as e:
        logger.exception("Error in handle_send_code")
        return web.json_response({"error": str(e)}, status=400)

async def handle_sign_in(request: web.Request):
    try:
        data = await request.json()
        phone = str(data.get("phone", "")).strip()
        code = str(data.get("code", "")).strip()
        phone_code_hash = data.get("phone_code_hash")
        password = data.get("password")

        if not phone or not code or not phone_code_hash:
            return web.json_response({"error": "Phone, verification code, and phone code hash are required."}, status=400)

        res = await manager.sign_in_code(phone, code, phone_code_hash, password)
        return web.json_response(res)
    except Exception as e:
        logger.exception("Error in handle_sign_in")
        return web.json_response({"error": str(e)}, status=400)

async def handle_list_dialogs(request: web.Request):
    try:
        dialogs = await manager.list_dialogs()
        return web.json_response({"dialogs": dialogs, "current": manager.storage_chat})
    except Exception as e:
        return web.json_response({
            "dialogs": [{"id": "me", "title": "Self (Saved Messages)", "is_self": True, "badge": "Private & Default"}],
            "current": manager.storage_chat or "me"
        })

async def handle_disconnect(request: web.Request):
    try:
        res = await manager.disconnect()
        return web.json_response(res)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

async def handle_update_storage(request: web.Request):
    try:
        data = await request.json()
        storage_chat = str(data.get("storage_chat", "me")).strip()
        manager.storage_chat = storage_chat
        manager.save_config()
        # Verify entity if connected
        if manager.is_connected:
            entity = await manager.get_target_entity()
            entity_name = getattr(entity, "title", getattr(entity, "first_name", storage_chat))
            return web.json_response({"success": True, "storage_chat": storage_chat, "entity_name": entity_name})
        return web.json_response({"success": True, "storage_chat": storage_chat})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=400)

async def handle_upload(request: web.Request):
    try:
        data = await request.json()
        file_path = data.get("file_path")
        file_name = data.get("file_name")
        caption = data.get("caption")

        if not file_path or not file_name:
            return web.json_response({"error": "Missing file_path or file_name"}, status=400)

        result = await manager.upload_file(file_path, file_name, caption)
        return web.json_response(result)
    except Exception as e:
        logger.exception("Error uploading file")
        return web.json_response({"error": str(e)}, status=500)

async def handle_list_files(request: web.Request):
    try:
        files = await manager.list_files()
        return web.json_response({"files": files})
    except Exception as e:
        logger.exception("Error listing files")
        return web.json_response({"error": str(e)}, status=500)

async def handle_delete_file(request: web.Request):
    try:
        msg_id = int(request.match_info["message_id"])
        res = await manager.delete_file(msg_id)
        return web.json_response(res)
    except Exception as e:
        return web.json_response({"error": str(e)}, status=500)

async def handle_stream_file(request: web.Request):
    """
    Direct Access Streaming endpoint:
    Streams MTProto file directly with HTTP Range (Partial Content) support for videos and resumable downloads!
    """
    try:
        msg_id = int(request.match_info["message_id"])
        await manager.ensure_connected()
        if not manager.client or not manager.is_connected:
            return web.Response(text="Telegram MTProto Client not connected", status=503)

        entity = await manager.get_target_entity()
        msg = await manager.client.get_messages(entity, ids=msg_id)
        if not msg or not msg.media:
            return web.Response(text="File message not found in chat storage", status=404)

        # Get file attributes
        file_name = "download"
        file_size = 0
        mime_type = "application/octet-stream"

        if isinstance(msg.media, MessageMediaDocument) and msg.media.document:
            doc = msg.media.document
            file_size = doc.size
            mime_type = doc.mime_type or "application/octet-stream"
            for attr in doc.attributes:
                if isinstance(attr, DocumentAttributeFilename):
                    file_name = attr.file_name
                    break
        elif isinstance(msg.media, MessageMediaPhoto):
            file_name = f"photo_{msg_id}.jpg"
            mime_type = "image/jpeg"
            file_size = 0

        # Handle HTTP Range
        range_header = request.headers.get("Range")
        offset = 0
        limit_bytes = file_size

        status = 200
        headers = {
            "Content-Type": mime_type,
            "Accept-Ranges": "bytes",
            "Content-Disposition": f'inline; filename="{file_name}"',
        }

        if range_header and range_header.startswith("bytes=") and file_size > 0:
            ranges = range_header.replace("bytes=", "").split("-")
            start = int(ranges[0]) if ranges[0] else 0
            end = int(ranges[1]) if ranges[1] else file_size - 1
            if end >= file_size:
                end = file_size - 1
            offset = start
            limit_bytes = end - start + 1
            status = 206
            headers["Content-Range"] = f"bytes {start}-{end}/{file_size}"
            headers["Content-Length"] = str(limit_bytes)
        elif file_size > 0:
            headers["Content-Length"] = str(file_size)

        response = web.StreamResponse(status=status, headers=headers)
        await response.prepare(request)

        # Download and stream directly from Telegram MTProto
        bytes_sent = 0
        chunk_size = 128 * 1024 # 128KB chunks
        async for chunk in manager.client.iter_download(msg.media, offset=offset, request_size=chunk_size):
            if limit_bytes and bytes_sent + len(chunk) > limit_bytes:
                needed = limit_bytes - bytes_sent
                await response.write(chunk[:needed])
                break
            await response.write(chunk)
            bytes_sent += len(chunk)

        await response.write_eof()
        return response
    except Exception as e:
        logger.exception("Error in handle_stream_file")
        return web.Response(text=f"Error streaming file: {str(e)}", status=500)

async def on_startup(app: web.Application):
    logger.info("Aiohttp server startup: initializing saved Telegram client on active loop...")
    await manager.init_saved_client()

async def on_cleanup(app: web.Application):
    logger.info("Aiohttp server cleanup: closing Telegram client session...")
    if manager.client:
        try:
            await manager.client.disconnect()
        except Exception:
            pass

def init_app():
    app = web.Application(client_max_size=2000 * 1024 * 1024)
    app.on_startup.append(on_startup)
    app.on_cleanup.append(on_cleanup)

    app.router.add_get("/api/py/status", handle_status)
    app.router.add_post("/api/py/connect", handle_connect)
    app.router.add_post("/api/py/send_code", handle_send_code)
    app.router.add_post("/api/py/sign_in", handle_sign_in)
    app.router.add_post("/api/py/disconnect", handle_disconnect)
    app.router.add_post("/api/py/storage", handle_update_storage)
    app.router.add_get("/api/py/dialogs", handle_list_dialogs)
    app.router.add_post("/api/py/upload", handle_upload)
    app.router.add_get("/api/py/files", handle_list_files)
    app.router.add_delete("/api/py/files/{message_id}", handle_delete_file)
    app.router.add_get("/api/py/stream/{message_id}", handle_stream_file)

    return app

if __name__ == "__main__":
    port = int(os.environ.get("PY_PORT", 5050))
    app = init_app()
    web.run_app(app, host="127.0.0.1", port=port)
