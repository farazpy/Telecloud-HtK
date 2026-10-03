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
import urllib.parse
from typing import Optional, Dict, Any
from pathlib import Path

try:
    import socks
except ImportError:
    socks = None

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
    AuthKeyDuplicatedError,
    RPCError,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("telethon_storage")

DATA_DIR = Path("./data")
DATA_DIR.mkdir(parents=True, exist_ok=True)
CONFIG_FILE = DATA_DIR / "config.json"

def parse_proxy(proxy_url: Optional[str]):
    if not proxy_url or not str(proxy_url).strip() or not socks:
        return None
    try:
        raw = str(proxy_url).strip()
        parsed = urllib.parse.urlparse(raw)
        scheme = (parsed.scheme or "socks5").lower()
        if scheme in ("socks5", "socks5h"):
            proxy_type = socks.SOCKS5
        elif scheme in ("socks4", "socks4a"):
            proxy_type = socks.SOCKS4
        elif scheme in ("http", "https"):
            proxy_type = socks.HTTP
        else:
            return None
        
        host = parsed.hostname
        port = parsed.port or (1080 if "socks" in scheme else 8080)
        username = parsed.username
        password = parsed.password
        
        if username and password:
            return (proxy_type, host, port, True, username, password)
        return (proxy_type, host, port)
    except Exception as e:
        logger.warning(f"Error parsing proxy '{proxy_url}': {e}")
        return None

class TelethonManager:
    def __init__(self):
        self.client: Optional[TelegramClient] = None
        self.api_id: Optional[int] = None
        self.api_hash: Optional[str] = None
        self.session_str: Optional[str] = None
        self.phone_session_str: Optional[str] = None
        self.storage_chat: str = "me"
        self.pending_phone: Optional[str] = None
        self.pending_phone_code_hash: Optional[str] = None
        self.active_user: Optional[Dict[str, Any]] = None
        self.is_connected = False
        self.user_clients: Dict[str, TelegramClient] = {}

        # Custom Device Identity & Location/Proxy Configuration
        self.device_model: str = "TeleCloud Vault"
        self.system_version: str = "macOS Sonoma 14.5"
        self.app_version: str = "TeleCloud Vault v1.5.1"
        self.lang_code: str = "en"
        self.system_lang_code: str = "en"
        self.proxy_url: str = ""

        # QR Login state
        self.qr_client: Optional[TelegramClient] = None
        self.qr_login_obj = None
        self.qr_task: Optional[asyncio.Task] = None
        self.qr_status: str = "idle"
        self.qr_user: Optional[Dict[str, Any]] = None
        self.qr_error: Optional[str] = None

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

        if not self.api_id:
            self.api_id = 27254692
        if not self.api_hash:
            self.api_hash = "9f6f826a62b78378292fd224e943cb65"

        if CONFIG_FILE.exists():
            try:
                with open(CONFIG_FILE, "r") as f:
                    cfg = json.load(f)
                    self.api_id = cfg.get("api_id") or self.api_id
                    self.api_hash = cfg.get("api_hash") or self.api_hash
                    self.session_str = cfg.get("session_str")
                    self.storage_chat = cfg.get("storage_chat", "me")
                    self.device_model = cfg.get("device_model") or os.environ.get("TELEGRAM_DEVICE_MODEL") or "TeleCloud Vault"
                    self.system_version = cfg.get("system_version") or os.environ.get("TELEGRAM_SYSTEM_VERSION") or "macOS Sonoma 14.5"
                    self.app_version = cfg.get("app_version") or os.environ.get("TELEGRAM_APP_VERSION") or "TeleCloud Vault v1.5.1"
                    self.lang_code = cfg.get("lang_code") or "en"
                    self.system_lang_code = cfg.get("system_lang_code") or "en"
                    self.proxy_url = cfg.get("proxy_url") or os.environ.get("TELEGRAM_PROXY_URL") or ""
            except Exception as e:
                logger.error(f"Error loading config: {e}")

    def save_config(self):
        try:
            with open(CONFIG_FILE, "w") as f:
                json.dump({
                    "api_id": self.api_id,
                    "api_hash": self.api_hash,
                    "session_str": self.session_str,
                    "storage_chat": self.storage_chat,
                    "device_model": self.device_model,
                    "system_version": self.system_version,
                    "app_version": self.app_version,
                    "lang_code": self.lang_code,
                    "system_lang_code": self.system_lang_code,
                    "proxy_url": self.proxy_url
                }, f, indent=2)
        except Exception as e:
            logger.error(f"Error saving config: {e}")

    def create_telegram_client(
        self,
        session,
        api_id: Optional[int] = None,
        api_hash: Optional[str] = None,
        loop=None,
        device_model: Optional[str] = None,
        system_version: Optional[str] = None,
        app_version: Optional[str] = None,
        connection_retries: int = 5,
        retry_delay: int = 1,
        timeout: int = 20
    ) -> TelegramClient:
        dev = (device_model or self.device_model or "TeleCloud Vault").strip()
        sys_ver = (system_version or self.system_version or "macOS Sonoma 14.5").strip()
        app_ver = (app_version or self.app_version or "TeleCloud Vault v1.5.1").strip()
        proxy = parse_proxy(self.proxy_url)

        return TelegramClient(
            session,
            api_id or self.api_id or 27254692,
            api_hash or self.api_hash or "9f6f826a62b78378292fd224e943cb65",
            device_model=dev,
            system_version=sys_ver,
            app_version=app_ver,
            system_lang_code=self.system_lang_code,
            lang_code=self.lang_code,
            proxy=proxy,
            loop=loop,
            connection_retries=connection_retries,
            retry_delay=retry_delay,
            timeout=timeout
        )

    async def get_egress_location(self) -> Dict[str, Any]:
        try:
            import aiohttp
            async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=2.5)) as session:
                async with session.get("https://ipapi.co/json/") as resp:
                    if resp.status == 200:
                        data = await resp.json()
                        return {
                            "ip": data.get("ip"),
                            "city": data.get("city"),
                            "region": data.get("region"),
                            "country": data.get("country_name"),
                            "country_code": data.get("country_code"),
                            "org": data.get("org")
                        }
        except Exception:
            pass
        return {"ip": "Direct MTProto IP", "city": "Datacenter", "country": "Telegram DC", "country_code": "GLOBAL"}

    async def ensure_connected(self):
        try:
            current_loop = asyncio.get_running_loop()
        except RuntimeError:
            current_loop = None

        if self.client and current_loop and getattr(self.client, "loop", None) != current_loop:
            logger.warning("Event loop mismatch detected on TelegramClient. Re-binding to active event loop...")
            self.client = None
            self.is_connected = False

        # If client instance exists but TCP connection dropped, reconnect socket
        if self.client and hasattr(self.client, "is_connected") and not self.client.is_connected():
            try:
                logger.info("Reconnecting idle Telegram MTProto client socket...")
                await self.client.connect()
                self.is_connected = await self.client.is_user_authorized()
            except Exception as e:
                logger.warning(f"Notice during client reconnect: {e}")
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
                self.client = self.create_telegram_client(
                    StringSession(self.session_str),
                    loop=current_loop
                )
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
                err_str = str(e).lower()
                logger.error(f"Failed to auto-connect with saved session: {e}")
                self.is_connected = False
                if "authorization key" in err_str or "two different ip" in err_str or "authkey" in err_str or "revoked" in err_str:
                    logger.warning("Telegram session was invalidated due to concurrent multi-IP usage or key conflict. Resetting stale session...")
                    self.session_str = None
                    self.active_user = None
                    self.client = None
                    self.save_config()

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
            client = self.create_telegram_client(session, api_id=api_id, api_hash=api_hash, loop=current_loop)
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
            return {"success": True, "user": self.active_user, "session_str": self.session_str}
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

            client = self.create_telegram_client(StringSession(session_str), api_id=api_id, api_hash=api_hash, loop=current_loop)
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
            return {"success": True, "user": self.active_user, "session_str": self.session_str}
        except Exception as e:
            logger.error(f"Error connecting session string: {e}")
            raise e

    async def get_client_for_session(self, session_str: Optional[str] = None) -> Optional[TelegramClient]:
        if not session_str or not str(session_str).strip():
            await self.ensure_connected()
            if self.client and self.is_connected:
                return self.client
            return None

        clean_session = str(session_str).strip()
        # Check active client pool
        if clean_session in self.user_clients:
            existing = self.user_clients[clean_session]
            try:
                if not existing.is_connected():
                    await existing.connect()
                if await existing.is_user_authorized():
                    return existing
            except Exception as e:
                logger.warning(f"Cached user client connection issue: {e}")
                try:
                    await existing.disconnect()
                except Exception:
                    pass
                self.user_clients.pop(clean_session, None)

        # Connect user session string
        try:
            try:
                current_loop = asyncio.get_running_loop()
            except RuntimeError:
                current_loop = None

            user_client = self.create_telegram_client(
                StringSession(clean_session),
                loop=current_loop,
                connection_retries=3,
                retry_delay=1,
                timeout=15
            )
            await user_client.connect()
            if await user_client.is_user_authorized():
                self.user_clients[clean_session] = user_client
                return user_client
            else:
                logger.warning("User session is unauthorized or revoked by Telegram.")
                try:
                    await user_client.disconnect()
                except Exception:
                    pass
                return None
        except Exception as e:
            logger.warning(f"Error connecting user session client: {e}")
            return None

    async def resolve_entity_for_client(self, client: TelegramClient, target: Any):
        if not target or target == "me":
            return "me"
        target_str = str(target).strip()
        if (target_str.startswith("-100") and target_str[4:].isdigit()) or \
           (target_str.startswith("-") and target_str[1:].isdigit()) or \
           target_str.isdigit():
            target_int = int(target_str)
            try:
                return await client.get_input_entity(target_int)
            except Exception:
                try:
                    return await client.get_entity(target_int)
                except Exception:
                    return target_int
        try:
            return await client.get_input_entity(target_str)
        except Exception:
            try:
                return await client.get_entity(target_str)
            except Exception:
                return target_str

    async def send_code_request(self, api_id: int, api_hash: str, phone: str, storage_chat: str = "me"):
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
        client = self.create_telegram_client(session, api_id=api_id, api_hash=api_hash, loop=current_loop)
        await client.connect()

        try:
            res = await client.send_code_request(phone_clean)
        except PhoneNumberInvalidError:
            raise ValueError(f"Invalid phone number format '{phone}'. Please check your country code and digits.") from None
        except PhoneNumberBannedError:
            raise ValueError(f"The phone number '{phone}' has been banned by Telegram.") from None
        except FloodWaitError as e:
            raise ValueError(f"Telegram rate limit: please wait {e.seconds} seconds before requesting a code again.") from None
        except ApiIdInvalidError:
            raise ValueError("Invalid Telegram API ID or API Hash configuration.") from None
        except Exception as first_err:
            err_text = str(first_err)
            if "UPDATE_APP_TO_LOGIN" in err_text or "406" in err_text:
                raise ValueError(
                    "Telegram requires QR code verification for this account. "
                    "Please switch to the 'QR Scan' tab above to log in instantly via Telegram Settings → Devices."
                ) from None
            raise first_err from None

        self.client = client
        self.api_id = api_id
        self.api_hash = api_hash
        self.pending_phone = phone_clean
        self.pending_phone_code_hash = res.phone_code_hash
        self.storage_chat = storage_chat
        self.phone_session_str = session.save()
        return {
            "success": True,
            "phone_code_hash": res.phone_code_hash,
            "timeout": getattr(res, "timeout", None)
        }

    async def sign_in_code(self, phone: str, code: str, phone_code_hash: str, password: Optional[str] = None):
        phone_clean = phone.strip().replace(" ", "").replace("-", "").replace("(", "").replace(")", "")
        if not phone_clean.startswith("+"):
            phone_clean = "+" + phone_clean
        code_clean = code.strip().replace(" ", "")

        try:
            current_loop = asyncio.get_running_loop()
        except RuntimeError:
            current_loop = None

        if not self.client or not self.client.is_connected():
            if self.phone_session_str and self.api_id and self.api_hash:
                self.client = self.create_telegram_client(StringSession(self.phone_session_str), loop=current_loop)
                await self.client.connect()
            elif self.session_str and self.api_id and self.api_hash:
                self.client = self.create_telegram_client(StringSession(self.session_str), loop=current_loop)
                await self.client.connect()
            else:
                raise ValueError("No active Telegram connection. Please request verification code first.")

        try:
            if password:
                # 2FA Step: first attempt password directly if already in 2FA state
                try:
                    await self.client.sign_in(password=password)
                except Exception:
                    # If not in 2FA state yet, try phone+code then password
                    try:
                        await self.client.sign_in(phone=phone_clean, code=code_clean, phone_code_hash=phone_code_hash)
                    except SessionPasswordNeededError:
                        await self.client.sign_in(password=password)
            else:
                # Code Step:
                try:
                    await self.client.sign_in(phone=phone_clean, code=code_clean, phone_code_hash=phone_code_hash)
                except SessionPasswordNeededError:
                    return {"requires_password": True, "message": "Two-factor authentication (2FA) password required."}

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
            return {"success": True, "user": self.active_user, "session_str": self.session_str}
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

    # =========================================================================
    # QR CODE LOGIN (Continuous Listener + Direct Authorization Detection)
    # =========================================================================
    async def start_qr_login(self, api_id: int, api_hash: str, storage_chat: str = "me"):
        try:
            if hasattr(self, "qr_task") and self.qr_task and not self.qr_task.done():
                self.qr_task.cancel()
                self.qr_task = None

            if self.qr_client:
                try:
                    await self.qr_client.disconnect()
                except Exception:
                    pass
                self.qr_client = None

            try:
                current_loop = asyncio.get_running_loop()
            except RuntimeError:
                current_loop = None

            session = StringSession()
            self.qr_client = self.create_telegram_client(session, api_id=api_id, api_hash=api_hash, loop=current_loop)
            await self.qr_client.connect()
            self.qr_login_obj = await self.qr_client.qr_login()
            self.api_id = api_id
            self.api_hash = api_hash
            self.storage_chat = storage_chat

            self.qr_status = "waiting"
            self.qr_user = None
            self.qr_error = None

            # Launch continuous background task to keep event listener alive!
            self.qr_task = asyncio.create_task(self._run_qr_wait())

            expires_val = getattr(self.qr_login_obj, "expires", None)
            expires_str = expires_val.isoformat() if hasattr(expires_val, "isoformat") else str(expires_val or 300)

            return {
                "success": True,
                "token_url": self.qr_login_obj.url,
                "expires": expires_str
            }
        except Exception as e:
            logger.error(f"Error starting QR login: {e}")
            raise ValueError(f"Failed to generate QR code: {str(e)}")

    async def _run_qr_wait(self):
        try:
            user = await self.qr_login_obj.wait()
            if user:
                self.client = self.qr_client
                self.session_str = self.client.session.save()
                self.is_connected = True
                self.active_user = {
                    "id": user.id,
                    "first_name": getattr(user, "first_name", ""),
                    "last_name": getattr(user, "last_name", ""),
                    "username": getattr(user, "username", ""),
                    "is_bot": getattr(user, "bot", False),
                    "phone": getattr(user, "phone", "")
                }
                self.save_config()
                self.qr_status = "authorized"
                self.qr_user = self.active_user
                logger.info(f"QR Login successfully authorized for: {self.active_user.get('first_name')} (ID: {user.id})")
        except SessionPasswordNeededError:
            logger.info("QR Login requires 2FA cloud password")
            self.qr_status = "requires_password"
        except asyncio.CancelledError:
            pass
        except Exception as e:
            err_msg = str(e).lower()
            if "expired" in err_msg or "timeout" in err_msg:
                self.qr_status = "expired"
            else:
                logger.warning(f"Notice in QR wait task: {e}")
                self.qr_status = "error"
                self.qr_error = str(e)

    async def check_qr_login(self, password: Optional[str] = None):
        if not self.qr_client:
            if self.is_connected and self.active_user:
                return {"status": "authorized", "user": self.active_user}
            return {"status": "not_started", "message": "QR login has not been initiated."}

        # 1. 2FA Password Submission
        if password:
            try:
                user = await self.qr_client.sign_in(password=password)
                self.client = self.qr_client
                self.session_str = self.client.session.save()
                self.is_connected = True
                self.active_user = {
                    "id": user.id,
                    "first_name": getattr(user, "first_name", ""),
                    "last_name": getattr(user, "last_name", ""),
                    "username": getattr(user, "username", ""),
                    "is_bot": getattr(user, "bot", False),
                    "phone": getattr(user, "phone", "")
                }
                self.save_config()
                self.qr_status = "authorized"
                return {"status": "authorized", "user": self.active_user, "session_str": self.session_str}
            except Exception as e:
                logger.error(f"2FA sign in error during QR login: {e}")
                return {"status": "requires_password", "error": str(e)}

        # 2. Check if background wait task reported authorized
        if getattr(self, "qr_status", None) == "authorized":
            return {"status": "authorized", "user": self.qr_user or self.active_user, "session_str": self.session_str}

        if getattr(self, "qr_status", None) == "requires_password":
            return {"status": "requires_password", "message": "Two-factor authentication (2FA) password required."}

        if getattr(self, "qr_status", None) == "expired":
            return {"status": "expired", "message": "QR Code expired. Please refresh to generate a new QR."}

        # 3. Direct Safety Check: Query Telegram directly to see if user linked the device
        try:
            if await self.qr_client.is_user_authorized():
                me = await self.qr_client.get_me()
                if me:
                    self.client = self.qr_client
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
                    self.qr_status = "authorized"
                    logger.info(f"QR safety check confirmed authorization for: {self.active_user.get('first_name')}")
                    return {"status": "authorized", "user": self.active_user, "session_str": self.session_str}
        except SessionPasswordNeededError:
            self.qr_status = "requires_password"
            return {"status": "requires_password", "message": "Two-factor authentication (2FA) password required."}
        except Exception as e:
            logger.debug(f"Direct authorization check notice: {e}")

        return {"status": "waiting"}

    async def list_dialogs(self):
        await self.ensure_connected()
        is_bot = bool(self.active_user and self.active_user.get("is_bot"))

        if is_bot:
            return [{
                "id": self.storage_chat if self.storage_chat != "me" else "custom",
                "title": f"Bot Storage Channel ({self.storage_chat})",
                "type": "channel",
                "is_self": False,
                "badge": "Bot Channel",
                "description": "Telegram Channel or Group where bot is Administrator"
            }]

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
            logger.warning(f"Notice fetching dialogs: {e}")

        return dialogs

    async def disconnect(self):
        try:
            if self.client:
                await self.client.disconnect()
            if self.qr_client:
                await self.qr_client.disconnect()
            self.client = None
            self.qr_client = None
            self.qr_login_obj = None
            self.is_connected = False
            self.active_user = None
            self.session_str = None
            self.save_config()
            return {"success": True}
        except Exception as e:
            logger.error(f"Error during disconnect: {e}")
            raise e

    async def get_target_entity(self, chat_target: Optional[str] = None):
        await self.ensure_connected()
        if not self.client or not self.is_connected:
            raise ValueError("Telegram client is not connected.")

        target = chat_target or self.storage_chat or "me"
        is_bot = bool(self.active_user and self.active_user.get("is_bot"))

        if target in ("me", "self"):
            if is_bot:
                raise ValueError(
                    "Telegram Bot accounts cannot use personal 'Saved Messages (me)'. "
                    "Please set your Storage Destination to a Channel ID (e.g. -100xxxxxxxxxx) or Group ID where your bot is added as Administrator."
                )
            return "me"
        
        try:
            # Check if numeric chat ID (Channel, Supergroup, Group)
            target_str = str(target).strip()
            if (target_str.startswith("-100") and target_str[4:].isdigit()) or \
               (target_str.startswith("-") and target_str[1:].isdigit()) or \
               target_str.isdigit():
                target_int = int(target_str)
                try:
                    return await self.client.get_input_entity(target_int)
                except Exception:
                    try:
                        return await self.client.get_entity(target_int)
                    except Exception:
                        return target_int

            try:
                return await self.client.get_input_entity(target_str)
            except Exception:
                try:
                    return await self.client.get_entity(target_str)
                except Exception:
                    return target_str
        except Exception as e:
            logger.error(f"Error resolving target entity '{target}': {e}")
            raise ValueError(f"Could not resolve storage chat entity '{target}'. Verify channel ID or admin access.")

    async def upload_file(self, file_path: str, file_name: str, caption: Optional[str] = None, session_str: Optional[str] = None):
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found on disk: {file_path}")

        file_size = os.path.getsize(file_path)
        mime_type, _ = mimetypes.guess_type(file_name)
        mime_type = mime_type or "application/octet-stream"

        active_client = None
        session_type = "user"
        if session_str and str(session_str).strip():
            try:
                active_client = await self.get_client_for_session(session_str)
            except Exception as e:
                logger.warning(f"Notice connecting user session for upload: {e}")

        # If user session not provided, expired, or failed, fallback to Admin session
        if not active_client:
            logger.info("Using Admin Telegram session (fallback) for file upload...")
            await self.ensure_connected()
            if self.client and self.is_connected:
                active_client = self.client
                session_type = "admin_fallback"
            else:
                raise ValueError("Telegram connectivity lost, login to dashboard and click reconnect button.")

        entity = await self.resolve_entity_for_client(active_client, self.storage_chat)
        logger.info(f"Uploading '{file_name}' ({file_size} bytes) via {session_type} session to '{self.storage_chat}'...")

        # Progress tracking callback
        uploaded_bytes = 0
        def callback(current, total):
            nonlocal uploaded_bytes
            uploaded_bytes = current

        try:
            msg = await active_client.send_file(
                entity,
                file_path,
                caption=caption or "",
                force_document=True,
                attributes=[DocumentAttributeFilename(file_name)],
                progress_callback=callback
            )
        except Exception as upload_err:
            if session_type == "user":
                logger.warning(f"User session upload error: {upload_err}. Attempting fallback to Admin session...")
                await self.ensure_connected()
                if self.client and self.is_connected:
                    active_client = self.client
                    entity = await self.resolve_entity_for_client(active_client, self.storage_chat)
                    msg = await active_client.send_file(
                        entity,
                        file_path,
                        caption=caption or "",
                        force_document=True,
                        attributes=[DocumentAttributeFilename(file_name)],
                        progress_callback=callback
                    )
                    session_type = "admin_fallback"
                else:
                    raise ValueError("Telegram connectivity lost, login to dashboard and click reconnect button.")
            else:
                raise upload_err

        return {
            "success": True,
            "message_id": msg.id,
            "file_name": file_name,
            "file_size": file_size,
            "mime_type": mime_type,
            "storage_chat": str(self.storage_chat),
            "session_type": session_type
        }

    async def list_files(self, limit: int = 50):
        await self.ensure_connected()
        if not self.client or not self.is_connected:
            return []

        # Bot accounts cannot call iter_messages/GetHistoryRequest without special peer cache
        if self.active_user and self.active_user.get("is_bot"):
            return []

        files = []
        try:
            entity = await self.get_target_entity()
            async for msg in self.client.iter_messages(entity, limit=limit):
                if msg.media:
                    file_name = "unknown"
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
                        file_name = f"photo_{msg.id}.jpg"
                        mime_type = "image/jpeg"
                        file_size = 0

                    files.append({
                        "message_id": msg.id,
                        "file_name": file_name,
                        "file_size": file_size,
                        "mime_type": mime_type,
                        "caption": msg.text or "",
                        "date": msg.date.isoformat() if msg.date else "",
                        "storage_chat": str(self.storage_chat)
                    })
        except Exception as e:
            logger.warning(f"Notice listing MTProto history: {e}")

        return files

    async def delete_file(self, message_id: int):
        await self.ensure_connected()
        if not self.client or not self.is_connected:
            raise ValueError("Telegram client not connected")

        entity = await self.get_target_entity()
        await self.client.delete_messages(entity, [message_id])
        return {"success": True}

manager = TelethonManager()

# HTTP Handlers
async def handle_status(request: web.Request):
    await manager.ensure_connected()
    return web.json_response({
        "connected": manager.is_connected,
        "has_session": bool(manager.session_str),
        "api_id": manager.api_id,
        "api_hash": manager.api_hash,
        "storage_chat": manager.storage_chat,
        "user": manager.active_user,
        "device_model": manager.device_model,
        "system_version": manager.system_version,
        "app_version": manager.app_version,
        "proxy_url": manager.proxy_url
    })

async def handle_get_device_config(request: web.Request):
    location = await manager.get_egress_location()
    return web.json_response({
        "device_model": manager.device_model,
        "system_version": manager.system_version,
        "app_version": manager.app_version,
        "proxy_url": manager.proxy_url,
        "location": location
    })

async def handle_update_device_config(request: web.Request):
    try:
        data = await request.json() if request.can_read_body else {}
        if "device_model" in data and str(data["device_model"]).strip():
            manager.device_model = str(data["device_model"]).strip()
        if "system_version" in data and str(data["system_version"]).strip():
            manager.system_version = str(data["system_version"]).strip()
        if "app_version" in data and str(data["app_version"]).strip():
            manager.app_version = str(data["app_version"]).strip()
        if "proxy_url" in data:
            manager.proxy_url = str(data["proxy_url"]).strip()
        manager.save_config()
        location = await manager.get_egress_location()
        return web.json_response({
            "success": True,
            "device_model": manager.device_model,
            "system_version": manager.system_version,
            "app_version": manager.app_version,
            "proxy_url": manager.proxy_url,
            "location": location
        })
    except Exception as e:
        logger.error(f"Error in handle_update_device_config: {e}")
        return web.json_response({"error": str(e)}, status=400)

async def handle_session_data(request: web.Request):
    await manager.ensure_connected()
    return web.json_response({
        "success": True,
        "api_id": manager.api_id,
        "api_hash": manager.api_hash,
        "session_str": manager.session_str,
        "storage_chat": manager.storage_chat,
        "is_connected": manager.is_connected,
        "user": manager.active_user,
        "device_model": manager.device_model,
        "system_version": manager.system_version,
        "app_version": manager.app_version,
        "proxy_url": manager.proxy_url
    })

async def handle_connect(request: web.Request):
    try:
        data = await request.json()
        api_id = int(data.get("api_id") or manager.api_id or 27254692)
        api_hash = str(data.get("api_hash") or manager.api_hash or "9f6f826a62b78378292fd224e943cb65").strip()
        storage_chat = data.get("storage_chat", manager.storage_chat or "me")

        if data.get("device_model"):
            manager.device_model = str(data["device_model"]).strip()
        if data.get("system_version"):
            manager.system_version = str(data["system_version"]).strip()
        if data.get("app_version"):
            manager.app_version = str(data["app_version"]).strip()
        if "proxy_url" in data:
            manager.proxy_url = str(data["proxy_url"]).strip()
        manager.save_config()

        if "bot_token" in data:
            res = await manager.connect_bot(api_id, api_hash, data["bot_token"].strip(), storage_chat)
            return web.json_response(res)
        elif "string_session" in data:
            res = await manager.connect_session_string(api_id, api_hash, data["string_session"].strip(), storage_chat)
            return web.json_response(res)
        else:
            return web.json_response({"error": "Missing bot_token or string_session."}, status=400)
    except Exception as e:
        logger.exception("Error in handle_connect")
        return web.json_response({"error": str(e)}, status=400)

async def handle_send_code(request: web.Request):
    try:
        data = await request.json()
        api_id = int(data.get("api_id") or manager.api_id or 27254692)
        api_hash = str(data.get("api_hash") or manager.api_hash or "9f6f826a62b78378292fd224e943cb65").strip()
        phone = str(data.get("phone", "")).strip()
        storage_chat = data.get("storage_chat", manager.storage_chat or "me")

        if data.get("device_model"):
            manager.device_model = str(data["device_model"]).strip()
        if data.get("system_version"):
            manager.system_version = str(data["system_version"]).strip()
        if data.get("app_version"):
            manager.app_version = str(data["app_version"]).strip()
        if "proxy_url" in data:
            manager.proxy_url = str(data["proxy_url"]).strip()
        manager.save_config()

        if not phone:
            return web.json_response({"error": "Phone number is required."}, status=400)

        res = await manager.send_code_request(api_id, api_hash, phone, storage_chat)
        return web.json_response(res)
    except Exception as e:
        err_msg = str(e)
        if "UPDATE_APP_TO_LOGIN" in err_msg or "406" in err_msg or "QR" in err_msg:
            logger.warning(f"Phone code blocked by Telegram server policy: {err_msg}")
            return web.json_response({
                "error": err_msg,
                "suggest_qr": True
            }, status=400)
        logger.error(f"Error in handle_send_code: {err_msg}")
        return web.json_response({"error": err_msg}, status=400)

async def handle_sign_in(request: web.Request):
    try:
        data = await request.json()
        phone = str(data.get("phone", "")).strip()
        code = str(data.get("code", "")).strip()
        phone_code_hash = data.get("phone_code_hash")
        password = data.get("password")

        if not phone or (not code and not password) or not phone_code_hash:
            return web.json_response({"error": "Phone number, verification code/password, and code hash are required."}, status=400)

        res = await manager.sign_in_code(phone, code, phone_code_hash, password)
        return web.json_response(res)
    except Exception as e:
        logger.exception("Error in handle_sign_in")
        return web.json_response({"error": str(e)}, status=400)

async def handle_qr_start(request: web.Request):
    try:
        data = await request.json() if request.can_read_body else {}
        api_id = int(data.get("api_id") or manager.api_id or 27254692)
        api_hash = str(data.get("api_hash") or manager.api_hash or "9f6f826a62b78378292fd224e943cb65").strip()
        storage_chat = data.get("storage_chat", manager.storage_chat or "me")

        if data.get("device_model"):
            manager.device_model = str(data["device_model"]).strip()
        if data.get("system_version"):
            manager.system_version = str(data["system_version"]).strip()
        if data.get("app_version"):
            manager.app_version = str(data["app_version"]).strip()
        if "proxy_url" in data:
            manager.proxy_url = str(data["proxy_url"]).strip()
        manager.save_config()

        res = await manager.start_qr_login(api_id, api_hash, storage_chat)
        return web.json_response(res)
    except Exception as e:
        logger.exception("Error in handle_qr_start")
        return web.json_response({"error": str(e)}, status=400)

async def handle_qr_check(request: web.Request):
    try:
        data = await request.json() if request.can_read_body else {}
        password = data.get("password")
        res = await manager.check_qr_login(password=password)
        return web.json_response(res)
    except Exception as e:
        logger.exception("Error in handle_qr_check")
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
        session_str = data.get("session_str") or data.get("user_session")

        if not file_path or not file_name:
            return web.json_response({"error": "Missing file_path or file_name"}, status=400)

        result = await manager.upload_file(file_path, file_name, caption, session_str=session_str)
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
    try:
        msg_id = int(request.match_info["message_id"])
        chat_param = request.query.get("storage_chat") or request.query.get("chat_id")
        user_session = request.query.get("session_str") or request.query.get("user_session")

        active_client = None
        entity = None
        msg = None

        # 1. Try with user's Telegram session if provided
        if user_session and str(user_session).strip():
            try:
                user_client = await manager.get_client_for_session(user_session)
                if user_client and await user_client.is_user_authorized():
                    target_chat = chat_param or manager.storage_chat or "me"
                    user_entity = await manager.resolve_entity_for_client(user_client, target_chat)
                    try:
                        candidate = await user_client.get_messages(user_entity, ids=msg_id)
                        if candidate and candidate.media:
                            msg = candidate
                            active_client = user_client
                            entity = user_entity
                    except Exception as ue:
                        logger.warning(f"User session get_messages notice for #{msg_id}: {ue}")
            except Exception as e:
                logger.warning(f"User session stream init error: {e}")

        # 2. Fallback to Admin / System Session if user session unavailable or message not found
        if not msg or not msg.media:
            logger.info(f"Using Admin session fallback for stream message #{msg_id}...")
            for attempt in range(3):
                await manager.ensure_connected()
                if manager.client and manager.is_connected:
                    break
                await asyncio.sleep(0.5)

            if manager.client and manager.is_connected:
                admin_client = manager.client
                target_chat = chat_param or manager.storage_chat or "me"
                admin_entity = await manager.resolve_entity_for_client(admin_client, target_chat)
                try:
                    candidate = await admin_client.get_messages(admin_entity, ids=msg_id)
                    if candidate and candidate.media:
                        msg = candidate
                        active_client = admin_client
                        entity = admin_entity
                except Exception as ae:
                    logger.warning(f"Admin session entity notice for #{msg_id}: {ae}")

                # Secondary fallback to 'me' in admin session
                if (not msg or not msg.media) and target_chat != "me":
                    try:
                        candidate = await admin_client.get_messages("me", ids=msg_id)
                        if candidate and candidate.media:
                            msg = candidate
                            active_client = admin_client
                            entity = "me"
                    except Exception:
                        pass

        if not msg or not msg.media or not active_client:
            return web.Response(
                text="Telegram connectivity lost or file not found. Login to dashboard and click reconnect button.",
                status=404
            )

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

        range_header = request.headers.get("Range")
        offset = 0
        limit_bytes = file_size

        status = 200
        headers = {
            "Content-Type": mime_type,
            "Accept-Ranges": "bytes",
            "Content-Disposition": f'inline; filename="{file_name}"',
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
            "Access-Control-Allow-Headers": "*",
            "Access-Control-Expose-Headers": "Content-Length, Content-Range, Accept-Ranges, Content-Type, Content-Disposition, ETag",
            "Cross-Origin-Resource-Policy": "cross-origin",
            "Cache-Control": "public, max-age=31536000, immutable",
            "ETag": f'"{msg_id}-{file_size}"',
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

        # For HTTP HEAD requests, return headers immediately without streaming body
        if request.method == "HEAD":
            return response

        bytes_sent = 0
        chunk_size = 128 * 1024
        async for chunk in active_client.iter_download(msg.media, offset=offset, request_size=chunk_size):
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
        return web.Response(text="Telegram connectivity lost, login to dashboard and click reconnect button.", status=500)

async def handle_verify_session(request: web.Request):
    try:
        data = await request.json() if request.can_read_body else {}
        session_str = data.get("session_str")
        if not session_str:
            return web.json_response({
                "valid": False,
                "error": "Telegram connectivity lost, login to dashboard and click reconnect button."
            }, status=400)

        client = await manager.get_client_for_session(session_str)
        if client and await client.is_user_authorized():
            me = await client.get_me()
            return web.json_response({
                "valid": True,
                "user": {
                    "id": me.id,
                    "first_name": getattr(me, "first_name", ""),
                    "username": getattr(me, "username", "")
                }
            })
        return web.json_response({
            "valid": False,
            "error": "Telegram connectivity lost, login to dashboard and click reconnect button."
        })
    except Exception as e:
        return web.json_response({
            "valid": False,
            "error": f"Telegram connectivity lost: {str(e)}"
        })

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
    if manager.qr_client:
        try:
            await manager.qr_client.disconnect()
        except Exception:
            pass

def init_app():
    app = web.Application(client_max_size=2000 * 1024 * 1024)
    app.on_startup.append(on_startup)
    app.on_cleanup.append(on_cleanup)

    app.router.add_get("/api/py/status", handle_status)
    app.router.add_get("/api/py/device_config", handle_get_device_config)
    app.router.add_post("/api/py/device_config", handle_update_device_config)
    app.router.add_get("/api/py/session_data", handle_session_data)
    app.router.add_post("/api/py/verify_session", handle_verify_session)
    app.router.add_post("/api/py/connect", handle_connect)
    app.router.add_post("/api/py/send_code", handle_send_code)
    app.router.add_post("/api/py/sign_in", handle_sign_in)
    app.router.add_post("/api/py/qr/start", handle_qr_start)
    app.router.add_post("/api/py/qr/check", handle_qr_check)
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
