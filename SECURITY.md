# Security Notes

- Keep `.env`, WhatsApp session files, database files, and backups private.
- Set a strong, unique dashboard access policy before exposing the server publicly.
- The dashboard currently exposes read-only stats and recent logs; do not assume it is an authenticated admin panel.
- Custom command execution evaluates JavaScript with `new Function()`. This is effectively arbitrary code execution with the server process's permissions. Only use trusted code and do not expose command creation to untrusted users.
- Restrict network access to the dashboard where possible.
- Use HTTPS behind a trusted reverse proxy when hosting publicly.
- Rotate API keys immediately if they are accidentally committed or shared.
- Backups can contain phone numbers and command logs; protect and periodically prune them.
