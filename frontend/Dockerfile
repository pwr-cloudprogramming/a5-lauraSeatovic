FROM busybox:1.35

RUN adduser -D stud
USER stud
WORKDIR /home/stud

COPY src/ .

ARG ip


RUN sed -i "s#const baseUrl = 'http://localhost:8080';#const baseUrl = 'http://${ip}:8080';#g" tic_tac_toe.js
ENTRYPOINT ["busybox"]
EXPOSE 3000
CMD ["httpd", "-f", "-v", "-p", "3000"]