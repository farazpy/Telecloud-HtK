#!/usr/bin/env python3
"""
Telegram MTProto File Uploader using Telethon
Uploads files directly to your Telegram chat storage (Saved Messages or Channel)
and outputs direct access links.

Requirements:
    pip install telethon

Usage:
    python telethon_uploader.py --file /path/to/file.zip
"""

import os
import sys
import argparse
import asyncio
import mimetypes
from telethon import TelegramClient
from telethon.sessions import StringSession
from telethon.tl.types import DocumentAttributeFilename

# Telegram MTProto Credentials (Obtain from https://my.telegram.org)
API_ID = int(os.environ.get("TELEGRAM_API_ID", "0"))
API_HASH = os.environ.get("TELEGRAM_API_HASH", "")
BOT_TOKEN = os.environ.get("TELEGRAM_BOT_TOKEN", "")
SESSION_STRING = os.environ.get("TELEGRAM_SESSION_STRING", "")
CHAT_STORAGE = os.environ.get("TELEGRAM_CHAT_STORAGE", "me") # "me" for Saved Messages, or channel ID e.g. -1001234567890
APP_URL = os.environ.get("APP_URL", "")

async def progress_callback(current, total):
    percent = (current / total) * 100
    current_mb = current / (1024 * 1024)
    total_mb = total / (1024 * 1024)
    sys.stdout.write(f"\r[MTProto Upload] {percent:.1f}% ({current_mb:.2f} MB / {total_mb:.2f} MB)")
    sys.stdout.flush()

async def upload_file_to_telegram(
    file_path: str,
    api_id: int,
    api_hash: str,
    chat_storage: str = "me",
    bot_token: str = None,
    session_str: str = None,
    caption: str = None
):
    if not os.path.exists(file_path):
        print(f"Error: File not found at '{file_path}'")
        return None

    file_name = os.path.basename(file_path)
    file_size = os.path.getsize(file_path)
    file_size_mb = file_size / (1024 * 1024)

    print(f"[*] Preparing MTProto client for: {file_name} ({file_size_mb:.2f} MB)")

    session = StringSession(session_str) if session_str else "telecloud_session"
    client = TelegramClient(session, api_id, api_hash)

    if bot_token:
        print("[*] Authenticating with Bot Token...")
        await client.start(bot_token=bot_token)
    else:
        print("[*] Authenticating with User Session...")
        await client.start()

    me = await client.get_me()
    print(f"[+] Connected to Telegram as: {getattr(me, 'first_name', '')} (ID: {me.id})")

    # Resolve target chat storage
    target = chat_storage
    if str(target).lower() in ("me", "saved", "saved messages"):
        target_entity = "me"
    else:
        try:
            target_entity = int(target)
        except ValueError:
            target_entity = target

    print(f"[*] Uploading to chat storage: {chat_storage} ...")
    
    file_caption = caption or f"📂 {file_name}\n📦 Size: {file_size_mb:.2f} MB"

    msg = await client.send_file(
        target_entity,
        file_path,
        caption=file_caption,
        force_document=True,
        progress_callback=progress_callback,
        attributes=[DocumentAttributeFilename(file_name)]
    )

    print("\n[+] Upload Completed successfully!")
    print(f"[+] Message ID: {msg.id}")

    # Generate links
    telegram_link = f"https://t.me/c/{str(target).replace('-100', '')}/{msg.id}" if str(target).startswith("-100") else f"https://t.me/me"
    direct_api_link = f"{APP_URL}/api/download/{msg.id}/{file_name}" if APP_URL else f"/api/download/{msg.id}/{file_name}"

    print("-" * 50)
    print("DIRECT ACCESS LINKS:")
    print(f"-> Web Direct Download Link: {direct_api_link}")
    print(f"-> Telegram Storage Link:   {telegram_link}")
    print("-" * 50)

    await client.disconnect()
    return {
        "message_id": msg.id,
        "direct_link": direct_api_link,
        "telegram_link": telegram_link,
        "file_name": file_name,
        "file_size": file_size
    }

def main():
    parser = argparse.ArgumentParser(description="Upload file to Telegram MTProto chat storage using Telethon")
    parser.add_argument("--file", "-f", required=True, help="Path to the file to upload")
    parser.add_argument("--api-id", type=int, default=API_ID, help="Telegram API ID")
    parser.add_argument("--api-hash", type=str, default=API_HASH, help="Telegram API Hash")
    parser.add_argument("--bot-token", type=str, default=BOT_TOKEN, help="Telegram Bot Token (optional)")
    parser.add_argument("--session", type=str, default=SESSION_STRING, help="Telethon StringSession (optional)")
    parser.add_argument("--chat", type=str, default=CHAT_STORAGE, help="Target chat (e.g. 'me' or Channel ID)")
    parser.add_argument("--caption", type=str, default=None, help="Custom caption")

    args = parser.parse_args()

    if not args.api_id or not args.api_hash:
        print("Error: TELEGRAM_API_ID and TELEGRAM_API_HASH must be provided.")
        sys.exit(1)

    asyncio.run(upload_file_to_telegram(
        file_path=args.file,
        api_id=args.api_id,
        api_hash=args.api_hash,
        chat_storage=args.chat,
        bot_token=args.bot_token,
        session_str=args.session,
        caption=args.caption
    ))

if __name__ == "__main__":
    main()
