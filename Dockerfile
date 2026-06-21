FROM node:20-slim AS frontend-builder

WORKDIR /frontend
COPY frontend/ .
RUN npm install && npm run build


FROM python:3.12-slim

WORKDIR /app

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
COPY --from=frontend-builder /frontend/dist /app/static

RUN mkdir -p /app/uploads

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
