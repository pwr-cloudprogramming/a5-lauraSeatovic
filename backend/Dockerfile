FROM python:3.10-alpine

WORKDIR /app

COPY src/ .

ARG ip

RUN pip install -r requirements.txt


RUN sed -i "s#socketio = SocketIO(app, cors_allowed_origins='http://localhost:3000')#socketio = SocketIO(app, cors_allowed_origins='http://${ip}:8081')#g" app.py
ENTRYPOINT ["python3"]
EXPOSE 8080
CMD ["-u", "app.py"]