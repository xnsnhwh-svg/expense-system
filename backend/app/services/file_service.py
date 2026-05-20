import os
import uuid
from datetime import datetime

class FileService:
    def __init__(self, upload_dir: str = "uploads"):
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)

    def save_file(self, file, subfolder: str = "") -> str:
        if subfolder:
            target_dir = os.path.join(self.upload_dir, subfolder)
            os.makedirs(target_dir, exist_ok=True)
        else:
            target_dir = self.upload_dir

        ext = os.path.splitext(file.filename)[1]
        filename = f"{datetime.now().strftime('%Y%m%d%H%M%S')}_{uuid.uuid4().hex[:8]}{ext}"
        file_path = os.path.join(target_dir, filename)

        with open(file_path, "wb") as f:
            f.write(file.file.read())

        relative_path = os.path.join(subfolder, filename) if subfolder else filename
        return f"/uploads/{relative_path}"

file_service = FileService()