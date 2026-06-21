import re


def mask_bank_account(text: str) -> str:
    if not text:
        return text
    if len(text) <= 4:
        return "****"
    return text[:4] + "****" + text[-4:]


def mask_id_card(text: str) -> str:
    if not text:
        return text
    if len(text) >= 15:
        return text[:3] + "****" + text[-4:]
    return "****"


def mask_phone(text: str) -> str:
    if not text:
        return text
    if len(text) >= 11:
        return text[:3] + "****" + text[-4:]
    return "****"


def mask_name(text: str) -> str:
    if not text:
        return text
    if len(text) <= 1:
        return "*"
    return text[0] + "*" * (len(text) - 1)


def mask_sensitive_fields(data: dict, user_role: str) -> dict:
    if user_role == "admin":
        return data

    sensitive_keys = {
        "bank_account": mask_bank_account,
        "bank_card": mask_bank_account,
        "id_card": mask_id_card,
        "phone": mask_phone,
        "mobile": mask_phone,
        "payee_name": mask_name,
    }

    result = {}
    for key, value in data.items():
        if key in sensitive_keys and value:
            result[key] = sensitive_keys[key](str(value))
        elif isinstance(value, dict):
            result[key] = mask_sensitive_fields(value, user_role)
        elif isinstance(value, list):
            result[key] = [
                mask_sensitive_fields(item, user_role) if isinstance(item, dict) else item
                for item in value
            ]
        else:
            result[key] = value
    return result
