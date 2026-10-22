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
    import uvloop
    asyncio.set_event_loop_policy(uvloop.EventLoopPolicy())
except ImportError:
    pass

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
    PeerChannel,
    InputPeerChannel,
    Channel,
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

from telethon.tl.alltlobjects import tlobjects
from telethon.tl.types import User, Dialog, Chat, Channel, PeerChat, NotificationSoundLocal, Message, MessageMediaDocument
from telethon.tl.types.messages import ChannelMessages, Messages, MessagesSlice, Dialogs, DialogsSlice

class ChannelLegacy142:
    CONSTRUCTOR_ID = 0x8261ac61
    @classmethod
    def from_reader(cls, reader):
        flags = reader.read_int()
        _creator = bool(flags & 1)
        _left = bool(flags & 4)
        _broadcast = bool(flags & 32)
        _verified = bool(flags & 128)
        _megagroup = bool(flags & 256)
        _restricted = bool(flags & 512)
        _signatures = bool(flags & 2048)
        _min = bool(flags & 4096)
        _id = reader.read_long()
        _access_hash = reader.read_long() if (flags & 8192) else None
        _title = reader.tgread_string()
        _username = reader.tgread_string() if (flags & 64) else None
        _photo = reader.tgread_object()
        _date = reader.tgread_date()
        _restriction_reason = reader.tgread_vector() if (flags & 512) else []
        _admin_rights = reader.tgread_object() if (flags & 16384) else None
        _banned_rights = reader.tgread_object() if (flags & 32768) else None
        _default_banned_rights = reader.tgread_object() if (flags & 262144) else None
        _participants_count = reader.read_int() if (flags & 131072) else None

        return Channel(
            id=_id,
            title=_title,
            photo=_photo,
            date=_date,
            creator=_creator,
            left=_left,
            broadcast=_broadcast,
            verified=_verified,
            megagroup=_megagroup,
            restricted=_restricted,
            signatures=_signatures,
            min=_min,
            access_hash=_access_hash,
            username=_username,
            restriction_reason=_restriction_reason,
            admin_rights=_admin_rights,
            banned_rights=_banned_rights,
            default_banned_rights=_default_banned_rights,
            participants_count=_participants_count
        )

class MessageMediaDocumentLegacy9cb070d7(MessageMediaDocument):
    CONSTRUCTOR_ID = 0x9cb070d7
    SUBCLASS_OF_ID = 0xfe31a949

    @classmethod
    def from_reader(cls, reader):
        flags = reader.read_int()
        _nopremium = bool(flags & 8)
        _spoiler = bool(flags & 16)
        if flags & 1:
            _document = reader.tgread_object()
        else:
            _document = None
        if flags & 4:
            _ttl_seconds = reader.read_int()
        else:
            _ttl_seconds = None
        return cls(nopremium=_nopremium, spoiler=_spoiler, document=_document, ttl_seconds=_ttl_seconds)

class MessageLegacy38116ee0(Message):
    CONSTRUCTOR_ID = 0x38116ee0
    SUBCLASS_OF_ID = 0x7900a013

    @classmethod
    def from_reader(cls, reader):
        flags = reader.read_int()
        _out = bool(flags & 2)
        _mentioned = bool(flags & 16)
        _media_unread = bool(flags & 32)
        _silent = bool(flags & 8192)
        _post = bool(flags & 16384)
        _from_scheduled = bool(flags & 262144)
        _legacy = bool(flags & 524288)
        _edit_hide = bool(flags & 2097152)
        _pinned = bool(flags & 16777216)
        _noforwards = bool(flags & 67108864)

        _id = reader.read_int()
        if flags & 256:
            _from_id = reader.tgread_object()
        else:
            _from_id = None
        _peer_id = reader.tgread_object()
        if flags & 4:
            _fwd_from = reader.tgread_object()
        else:
            _fwd_from = None
        if flags & 2048:
            _via_bot_id = reader.read_long()
        else:
            _via_bot_id = None
        if flags & 8:
            _reply_to = reader.tgread_object()
        else:
            _reply_to = None
        _date = reader.tgread_date()
        _message = reader.tgread_string()
        if flags & 512:
            _media = reader.tgread_object()
        else:
            _media = None
        if flags & 64:
            _reply_markup = reader.tgread_object()
        else:
            _reply_markup = None
        if flags & 128:
            reader.read_int()
            _entities = []
            for _ in range(reader.read_int()):
                _x = reader.tgread_object()
                _entities.append(_x)
        else:
            _entities = None
        if flags & 1024:
            _views = reader.read_int()
            _forwards = reader.read_int()
        else:
            _views = None
            _forwards = None
        if flags & 8388608:
            _replies = reader.tgread_object()
        else:
            _replies = None
        if flags & 32768:
            _edit_date = reader.tgread_date()
        else:
            _edit_date = None
        if flags & 65536:
            _post_author = reader.tgread_string()
        else:
            _post_author = None
        if flags & 131072:
            _grouped_id = reader.read_long()
        else:
            _grouped_id = None
        if flags & 1048576:
            _reactions = reader.tgread_object()
        else:
            _reactions = None
        if flags & 4194304:
            reader.read_int()
            _restriction_reason = []
            for _ in range(reader.read_int()):
                _x = reader.tgread_object()
                _restriction_reason.append(_x)
        else:
            _restriction_reason = None
        if flags & 33554432:
            _ttl_period = reader.read_int()
        else:
            _ttl_period = None

        return cls(
            id=_id,
            peer_id=_peer_id,
            date=_date,
            message=_message,
            out=_out,
            mentioned=_mentioned,
            media_unread=_media_unread,
            silent=_silent,
            post=_post,
            from_scheduled=_from_scheduled,
            legacy=_legacy,
            edit_hide=_edit_hide,
            pinned=_pinned,
            noforwards=_noforwards,
            from_id=_from_id,
            fwd_from=_fwd_from,
            via_bot_id=_via_bot_id,
            reply_to=_reply_to,
            media=_media,
            reply_markup=_reply_markup,
            entities=_entities,
            views=_views,
            forwards=_forwards,
            replies=_replies,
            edit_date=_edit_date,
            post_author=_post_author,
            grouped_id=_grouped_id,
            reactions=_reactions,
            restriction_reason=_restriction_reason,
            ttl_period=_ttl_period
        )

class MessagesLegacy8c718e87(Messages):
    CONSTRUCTOR_ID = 0x8c718e87
    SUBCLASS_OF_ID = 0xd4b40b5

    @classmethod
    def from_reader(cls, reader):
        reader.read_int()
        _messages = []
        for _ in range(reader.read_int()):
            _x = reader.tgread_object()
            _messages.append(_x)
        reader.read_int()
        _chats = []
        for _ in range(reader.read_int()):
            _x = reader.tgread_object()
            _chats.append(_x)
        reader.read_int()
        _users = []
        for _ in range(reader.read_int()):
            _x = reader.tgread_object()
            _users.append(_x)
        return cls(messages=_messages, topics=[], chats=_chats, users=_users)

# Register newer & legacy Telegram MTProto layer constructor IDs safely without overwriting core MTProto types
NEW_TLOBJECT_MAP = {
    0x3ff6ecb0: User,
    0xa8edd0f5: Dialog,
    0x64479808: ChannelMessages,
    0x03d7e580: ChannelMessages,
    0x8261ac61: ChannelLegacy142,
    0x38116ee0: MessageLegacy38116ee0,
    0x9cb070d7: MessageMediaDocumentLegacy9cb070d7,
    0x8c718e87: MessagesLegacy8c718e87,
}
for _cid, _cls in NEW_TLOBJECT_MAP.items():
    tlobjects[_cid] = _cls

# Explicitly ensure core MTProto constructors are preserved and never overwritten
tlobjects[0x36c6019a] = PeerChat
tlobjects[0x830b9ae4] = NotificationSoundLocal
tlobjects[0x8261ac61] = ChannelLegacy142
tlobjects[0x38116ee0] = MessageLegacy38116ee0
tlobjects[0x9cb070d7] = MessageMediaDocumentLegacy9cb070d7
tlobjects[0x8c718e87] = MessagesLegacy8c718e87

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s", handlers=[
    logging.StreamHandler(sys.stderr),
    logging.FileHandler("/tmp/telethon.log", mode="a")
])
logging.getLogger("telethon").setLevel(logging.ERROR)
logging.getLogger("telethon.network").setLevel(logging.ERROR)
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

async def safe_disconnect(cl: Optional[TelegramClient]):
    if not cl:
        return
    try:
        if hasattr(cl, "disconnect"):
            await cl.disconnect()
    except Exception:
        pass

    try:
        sender = getattr(cl, "_sender", None)
        if sender:
            for task_attr in ["_recv_loop", "_send_loop"]:
                t = getattr(sender, task_attr, None)
                if t and not t.done():
                    t.cancel()
                    try:
                        await t
                    except (asyncio.CancelledError, Exception):
                        pass

            conn = getattr(sender, "_connection", None)
            if conn:
                for task_attr in ["_recv_loop", "_send_loop"]:
                    t = getattr(conn, task_attr, None)
                    if t and not t.done():
                        t.cancel()
                        try:
                            await t
                        except (asyncio.CancelledError, Exception):
                            pass
    except Exception:
        pass

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
        # In-memory fast channel peer cache (channel_id -> InputPeerChannel) to prevent slow entity resolution
        self.channel_peer_map: Dict[str, InputPeerChannel] = {
            "4375482614": InputPeerChannel(4375482614, 5710112122720099569),
            "-1004375482614": InputPeerChannel(4375482614, 5710112122720099569),
            "beyounges3": InputPeerChannel(4375482614, 5710112122720099569),
            "4412742519": InputPeerChannel(4412742519, -8402166414472808128),
            "-1004412742519": InputPeerChannel(4412742519, -8402166414472808128),
            "4416901245": InputPeerChannel(4416901245, -6084948190269295985),
            "-1004416901245": InputPeerChannel(4416901245, -6084948190269295985),
            "3975639568": InputPeerChannel(3975639568, -1498371844986489895),
            "-1003975639568": InputPeerChannel(3975639568, -1498371844986489895),
        }

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
        self.bot_token: Optional[str] = None

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
                    self.bot_token = cfg.get("bot_token")
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
                    "proxy_url": self.proxy_url,
                    "bot_token": self.bot_token
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
                    await self.refresh_channel_peer_map()
                else:
                    self.is_connected = False
                    logger.warning("Saved session is not authorized.")
            except Exception as e:
                err_str = str(e).lower()
                logger.error(f"Failed to auto-connect with saved session: {e}")
                self.is_connected = False
                if isinstance(e, AuthKeyDuplicatedError) or "authorization key" in err_str or "two different ip" in err_str or "authkey" in err_str or "revoked" in err_str:
                    logger.warning("Telegram session was invalidated due to concurrent multi-IP usage or key conflict. Resetting stale session...")
                    self.session_str = None
                    self.active_user = None
                    if self.client:
                        try:
                            await self.client.disconnect()
                        except Exception:
                            pass
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
            self.bot_token = bot_token
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
            return {"success": False, "error": str(e)}

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
            err_str = str(e).lower()
            if isinstance(e, AuthKeyDuplicatedError) or "authorization key" in err_str or "two different ip" in err_str or "authkey" in err_str:
                logger.warning(f"Authorization key conflict on session string: {e}")
                self.session_str = None
                self.is_connected = False
                self.client = None
                self.save_config()
                return {
                    "success": False,
                    "error": "Session authorization key was invalidated due to simultaneous multi-IP logins. Please login again with QR Code or Phone OTP.",
                    "is_expired": True
                }
            logger.error(f"Error connecting session string: {e}")
            return {"success": False, "error": str(e)}

    async def get_client_for_session(self, session_str: Optional[str] = None) -> Optional[TelegramClient]:
        if not session_str or not str(session_str).strip():
            await self.ensure_connected()
            if self.client and self.is_connected:
                return self.client
            return None

        clean_session = str(session_str).strip()

        # Check if requested session matches primary manager session to reuse existing active client
        if self.session_str and clean_session == str(self.session_str).strip():
            await self.ensure_connected()
            if self.client and self.is_connected:
                return self.client

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

    def cache_channel_entity(self, channel_id: int, access_hash: int, username: Optional[str] = None):
        ch_id_str = str(channel_id)
        inp = InputPeerChannel(channel_id, access_hash)
        self.channel_peer_map[ch_id_str] = inp
        self.channel_peer_map[f"-100{ch_id_str}"] = inp
        if username:
            self.channel_peer_map[username.lower().lstrip('@')] = inp

    async def refresh_channel_peer_map(self, client: Optional[TelegramClient] = None):
        target_client = client or self.client
        if not target_client or not target_client.is_connected():
            return
        try:
            # First attempt high-level get_dialogs which handles entity caching safely
            found_count = 0
            try:
                dialogs = await target_client.get_dialogs(limit=100)
                for d in dialogs:
                    c = getattr(d, 'entity', None)
                    if c:
                        ch_id = getattr(c, 'id', None)
                        acc_hash = getattr(c, 'access_hash', None)
                        if ch_id and acc_hash:
                            self.cache_channel_entity(ch_id, acc_hash, getattr(c, 'username', None))
                            found_count += 1
                            if getattr(c, 'title', None):
                                norm_title = c.title.lower().replace(' ', '')
                                self.channel_peer_map[norm_title] = InputPeerChannel(ch_id, acc_hash)
            except Exception:
                # Fallback to direct GetDialogsRequest if needed
                from telethon.tl.functions.messages import GetDialogsRequest
                from telethon.tl.types import InputPeerEmpty
                res = await target_client(GetDialogsRequest(
                    offset_date=None,
                    offset_id=0,
                    offset_peer=InputPeerEmpty(),
                    limit=100,
                    hash=0
                ))
                for c in getattr(res, 'chats', []):
                    ch_id = getattr(c, 'id', None)
                    acc_hash = getattr(c, 'access_hash', None)
                    if ch_id and acc_hash:
                        self.cache_channel_entity(ch_id, acc_hash, getattr(c, 'username', None))
                        found_count += 1
                        if getattr(c, 'title', None):
                            norm_title = c.title.lower().replace(' ', '')
                            self.channel_peer_map[norm_title] = InputPeerChannel(ch_id, acc_hash)
            logger.info(f"Refreshed channel peer map ({len(self.channel_peer_map)} mapped channels/peers, {found_count} detected).")
        except Exception as e:
            logger.warning(f"Notice refreshing channel peer map: {e}")

    async def resolve_entity_for_client(self, client: TelegramClient, target: Any):
        if not target or str(target).strip().lower() == "me":
            return "me"

        target_str = str(target).strip()

        # Direct 0ms instant resolution from pre-seeded / in-memory peer map
        if target_str in self.channel_peer_map:
            return self.channel_peer_map[target_str]
        clean_target = target_str[4:] if target_str.startswith("-100") else target_str
        if clean_target in self.channel_peer_map:
            return self.channel_peer_map[clean_target]
        lower_target = target_str.lower().lstrip('@')
        if lower_target in self.channel_peer_map:
            return self.channel_peer_map[lower_target]

        # Refresh channel peer map from dialogs if target not in cache yet
        await self.refresh_channel_peer_map(client)
        if target_str in self.channel_peer_map:
            return self.channel_peer_map[target_str]
        if clean_target in self.channel_peer_map:
            return self.channel_peer_map[clean_target]
        if lower_target in self.channel_peer_map:
            return self.channel_peer_map[lower_target]

        async def _try_fetch(t_val):
            t_s = str(t_val).strip()
            # 1. Try direct numeric ID
            if (t_s.startswith("-100") and t_s[4:].isdigit()) or \
               (t_s.startswith("-") and t_s[1:].isdigit()) or \
               t_s.isdigit():
                t_int = int(t_s)
                try:
                    return await client.get_input_entity(t_int)
                except Exception:
                    try:
                        return await client.get_entity(t_int)
                    except Exception:
                        pass
                
                # 2. For channels starting with -100, try PeerChannel directly
                if t_s.startswith("-100") and t_s[4:].isdigit():
                    try:
                        channel_id = int(t_s[4:])
                        return await client.get_input_entity(PeerChannel(channel_id))
                    except Exception:
                        try:
                            return await client.get_entity(PeerChannel(channel_id))
                        except Exception:
                            pass

            # 3. Try string username or peer representation
            try:
                return await client.get_input_entity(t_s)
            except Exception:
                try:
                    return await client.get_entity(t_s)
                except Exception:
                    return None

        # 1. Attempt immediate resolution from local cache
        resolved = await _try_fetch(target_str)
        if resolved is not None:
            return resolved

        # 2. If entity not in cache, safely iterate dialogs to populate Telethon's internal entity DB
        try:
            logger.info(f"Populating Telethon entity cache for target '{target_str}'...")
            async for d in client.iter_dialogs(limit=50):
                if str(d.id) == target_str or str(getattr(d.entity, 'id', '')) == target_str:
                    return d.entity or d.input_entity
            resolved = await _try_fetch(target_str)
            if resolved is not None:
                return resolved
        except Exception as e:
            logger.warning(f"Notice during safe dialog iteration for '{target_str}': {e}")

        # 3. Final fallback: return numeric integer or string
        if (target_str.startswith("-100") and target_str[4:].isdigit()) or \
           (target_str.startswith("-") and target_str[1:].isdigit()) or \
           target_str.isdigit():
            return int(target_str)
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
                try:
                    await self.qr_task
                except (asyncio.CancelledError, Exception):
                    pass
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
            # 1. Primary method: GetDialogsRequest direct MTProto RPC
            from telethon.tl.functions.messages import GetDialogsRequest
            from telethon.tl.types import InputPeerEmpty
            res = await self.client(GetDialogsRequest(
                offset_date=None,
                offset_id=0,
                offset_peer=InputPeerEmpty(),
                limit=100,
                hash=0
            ))
            for c in getattr(res, "chats", []):
                try:
                    cid = str(getattr(c, "id", ""))
                    if not cid:
                        continue
                    full_cid = f"-100{cid}" if not cid.startswith("-") else cid
                    title = getattr(c, "title", None) or getattr(c, "name", None) or f"Chat {cid}"
                    is_ch = getattr(c, "broadcast", False) or getattr(c, "megagroup", False)
                    if not any(item["id"] == full_cid or item["id"] == cid for item in dialogs):
                        dialogs.append({
                            "id": full_cid,
                            "title": title,
                            "type": "channel" if is_ch else "group",
                            "is_self": False,
                            "badge": "Storage Channel" if is_ch else "Group Chat",
                            "description": f"ID: {full_cid}"
                        })
                except Exception:
                    continue
        except Exception as e1:
            logger.debug(f"GetDialogsRequest notice: {e1}")
            # 2. Fallback method: safe iter_dialogs
            try:
                async for d in self.client.iter_dialogs(limit=30, ignore_migrated=True):
                    try:
                        if d.is_channel or d.is_group:
                            cid = str(d.id)
                            if not any(item["id"] == cid for item in dialogs):
                                dialogs.append({
                                    "id": cid,
                                    "title": getattr(d, "name", None) or getattr(d, "title", None) or f"Chat {cid}",
                                    "type": "channel" if d.is_channel else "group",
                                    "is_self": False,
                                    "badge": "Storage Channel" if d.is_channel else "Group Chat",
                                    "description": f"ID: {cid}"
                                })
                    except Exception:
                        continue
            except Exception as e2:
                logger.debug(f"iter_dialogs notice: {e2}")

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

    async def upload_file(self, file_path: str, file_name: str, caption: Optional[str] = None, session_str: Optional[str] = None, storage_chat: Optional[str] = None):
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

        target_chat = storage_chat or self.storage_chat or "me"
        entity = await self.resolve_entity_for_client(active_client, target_chat)
        logger.info(f"Uploading '{file_name}' ({file_size} bytes) via {session_type} session to '{target_chat}'...")

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

    async def list_files(self, limit: int = 100, storage_chat: Optional[str] = None, session_str: Optional[str] = None):
        target_chat = (storage_chat or self.storage_chat or "me").strip()
        active_client = None

        if session_str and str(session_str).strip():
            try:
                active_client = await self.get_client_for_session(session_str)
            except Exception as e:
                logger.warning(f"User session get client notice for list_files: {e}")

        if not active_client:
            await self.ensure_connected()
            if self.client and self.is_connected:
                active_client = self.client

        if not active_client:
            return []

        # Bot accounts cannot call iter_messages/GetHistoryRequest without special peer cache
        if self.active_user and self.active_user.get("is_bot") and active_client == self.client:
            return []

        files = []
        try:
            entity = await self.resolve_entity_for_client(active_client, target_chat)
            async for msg in active_client.iter_messages(entity, limit=limit):
                if msg.media:
                    file_name = f"file_{msg.id}.bin"
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
                        "storage_chat": str(target_chat)
                    })
        except Exception as e:
            logger.warning(f"Notice listing MTProto history for '{target_chat}': {e}")

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
        "proxy_url": manager.proxy_url,
        "bot_token": manager.bot_token
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
        storage_chat = data.get("storage_chat") or data.get("chat_id")

        if not file_path or not file_name:
            return web.json_response({"error": "Missing file_path or file_name"}, status=400)

        result = await manager.upload_file(file_path, file_name, caption, session_str=session_str, storage_chat=storage_chat)
        return web.json_response(result)
    except Exception as e:
        logger.exception("Error uploading file")
        return web.json_response({"error": str(e)}, status=500)

async def handle_list_files(request: web.Request):
    try:
        limit = int(request.query.get("limit", 100))
        chat_param = request.query.get("storage_chat") or request.query.get("chat_id")
        user_session = request.query.get("session_str") or request.query.get("user_session")
        files = await manager.list_files(limit=limit, storage_chat=chat_param, session_str=user_session)
        return web.json_response({"files": files})
    except Exception as e:
        logger.exception("Error listing files")
        return web.json_response({"error": str(e)}, status=500)

async def handle_fetch_history(request: web.Request):
    try:
        data = await request.json() if request.can_read_body else {}
        limit = int(data.get("limit", 300))
        storage_chat = data.get("storage_chat")
        session_str = data.get("session_str")
        files = await manager.list_files(limit=limit, storage_chat=storage_chat, session_str=session_str)
        return web.json_response({"success": True, "count": len(files), "files": files})
    except Exception as e:
        logger.exception("Error in handle_fetch_history")
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
        await manager.ensure_connected()
        try:
            msg_id = int(request.match_info["message_id"])
        except (ValueError, TypeError):
            return web.Response(text="Invalid message ID format for file streaming.", status=400)

        chat_param = request.query.get("storage_chat") or request.query.get("chat_id")
        workspace_chat = request.query.get("workspace_chat")
        raw_session = request.headers.get("x-telegram-session") or request.query.get("session_str") or request.query.get("user_session")
        user_session = raw_session.strip().replace(" ", "+") if raw_session and isinstance(raw_session, str) else None

        active_client = None
        entity = None
        msg = None

        # Build list of target chats to try in priority order
        chats_to_try = []
        if workspace_chat and str(workspace_chat).strip():
            chats_to_try.append(str(workspace_chat).strip())
        if chat_param and str(chat_param).strip() and str(chat_param).strip() not in chats_to_try:
            chats_to_try.append(str(chat_param).strip())
        if manager.storage_chat and manager.storage_chat not in chats_to_try:
            chats_to_try.append(manager.storage_chat)
        if "me" not in chats_to_try:
            chats_to_try.append("me")

        logger.warning(f"[STREAM REQUEST] msg_id={msg_id}, chats_to_try={chats_to_try}")
        # 1. Try with user's Telegram session if provided
        user_client = None
        if user_session and str(user_session).strip():
            try:
                user_client = await manager.get_client_for_session(user_session)
                if user_client and await user_client.is_user_authorized():
                    for target_chat in chats_to_try:
                        try:
                            user_entity = await manager.resolve_entity_for_client(user_client, target_chat)
                            logger.warning(f"[STREAM USER TRY] target_chat={target_chat}, user_entity={user_entity}")
                            candidate = await user_client.get_messages(user_entity, ids=msg_id)
                            logger.warning(f"[STREAM USER CANDIDATE] msg_id={msg_id}, has_candidate={bool(candidate)}, media={type(getattr(candidate, 'media', None)).__name__ if candidate else None}")
                            if candidate and candidate.media:
                                msg = candidate
                                active_client = user_client
                                entity = user_entity
                                break
                        except Exception as ue:
                            logger.warning(f"User session get_messages notice for #{msg_id} in '{target_chat}': {ue}", exc_info=True)
            except Exception as e:
                logger.warning(f"User session stream init error: {e}", exc_info=True)

        # 2. Fallback to Admin / System Session if user session unavailable or message not found
        if not msg or not msg.media:
            for attempt in range(3):
                await manager.ensure_connected()
                if manager.client and manager.is_connected:
                    break
                await asyncio.sleep(0.5)

            if manager.client and manager.is_connected:
                admin_client = manager.client
                for target_chat in chats_to_try:
                    try:
                        admin_entity = await manager.resolve_entity_for_client(admin_client, target_chat)
                        logger.warning(f"[STREAM ADMIN TRY] target_chat={target_chat}, admin_entity={admin_entity}")
                        candidate = await admin_client.get_messages(admin_entity, ids=msg_id)
                        logger.warning(f"[STREAM ADMIN CANDIDATE] msg_id={msg_id}, has_candidate={bool(candidate)}, media={type(getattr(candidate, 'media', None)).__name__ if candidate else None}")
                        if candidate and candidate.media:
                            msg = candidate
                            active_client = admin_client
                            entity = admin_entity
                            break
                    except Exception as ae:
                        logger.warning(f"Admin session entity notice for #{msg_id} in '{target_chat}': {ae}", exc_info=True)

        # 3. Deep search across Telegram channel/group dialogs if message not found in specified targets
        if not msg or not msg.media:
            search_clients = []
            if user_client and await user_client.is_user_authorized():
                search_clients.append(user_client)
            if manager.client and manager.is_connected and manager.client not in search_clients:
                search_clients.append(manager.client)

            for cl in search_clients:
                try:
                    async for d in cl.iter_dialogs(limit=50):
                        d_id_str = str(d.id)
                        if d_id_str not in chats_to_try:
                            try:
                                candidate = await cl.get_messages(d.entity, ids=msg_id)
                                if candidate and candidate.media:
                                    msg = candidate
                                    active_client = cl
                                    entity = d.entity
                                    logger.info(f"Discovered message #{msg_id} in channel '{d.title}' ({d.id}) via dialog discovery!")
                                    break
                            except Exception:
                                pass
                        if msg and msg.media:
                            break
                except Exception as de:
                    logger.warning(f"Dialog search notice: {de}")
                if msg and msg.media:
                    break

        if not msg or not msg.media or not active_client:
            is_connected_somewhere = (manager.client and manager.is_connected) or (user_client and await user_client.is_user_authorized())
            err_msg = "File not found in Telegram channel storage or message was deleted." if is_connected_somewhere else "Telegram connectivity lost, login to dashboard and click reconnect button."
            logger.warning(f"[STREAM 404 REASON] msg_id={msg_id}, chats_to_try={chats_to_try}, is_connected={is_connected_somewhere}")
            return web.Response(
                text=err_msg,
                status=404 if is_connected_somewhere else 503
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
        chunk_size = 512 * 1024
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
    logger.info("Aiohttp server cleanup: closing all active Telegram MTProto client sessions...")
    if hasattr(manager, "qr_task") and manager.qr_task and not manager.qr_task.done():
        manager.qr_task.cancel()
        try:
            await manager.qr_task
        except (asyncio.CancelledError, Exception):
            pass
        manager.qr_task = None

    if manager.client:
        await safe_disconnect(manager.client)
        manager.client = None

    if manager.qr_client:
        await safe_disconnect(manager.qr_client)
        manager.qr_client = None

    for sess_key, u_cl in list(manager.user_clients.items()):
        await safe_disconnect(u_cl)
    manager.user_clients.clear()
    manager.is_connected = False

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
    app.router.add_post("/api/py/fetch_history", handle_fetch_history)
    app.router.add_delete("/api/py/files/{message_id}", handle_delete_file)
    app.router.add_get("/api/py/stream/{message_id}", handle_stream_file)

    return app

if __name__ == "__main__":
    port = int(os.environ.get("PY_PORT", 5050))
    app = init_app()
    web.run_app(app, host="127.0.0.1", port=port)
