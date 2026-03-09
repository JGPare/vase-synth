from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

from api.config import settings

conf = ConnectionConfig(
    MAIL_USERNAME=settings.SENDER_EMAIL,
    MAIL_PASSWORD=settings.SENDER_EMAIL_PASSWORD,
    MAIL_FROM=settings.SENDER_EMAIL,
    MAIL_PORT=465,
    MAIL_SERVER="mail.hover.com",
    MAIL_STARTTLS=False,
    MAIL_SSL_TLS=True,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=True,
)


async def send_password_reset_email(user, token: str):
    reset_url = f"/reset-verified/{token}"

    html = f"""
    <h2>Hi {user.username},</h2>
    <br>
    <h3>
      To reset your password
      <a href="{reset_url}">click here.</a>
    </h3>
    <br>
    <p>Thanks,<br>
    Vase Synth</p>
    """

    message = MessageSchema(
        subject="Vase Synth Password Reset",
        recipients=[user.email],
        body=html,
        subtype="html",
    )

    fm = FastMail(conf)
    await fm.send_message(message)
