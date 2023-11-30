FROM node:17 as builder

RUN mkdir /builder
WORKDIR /builder
COPY . . 
RUN npm install && \
    npm run build


FROM node:17-slim

RUN apt-get update && \ 
    apt-get install python python3-pip -y && \ 
    pip3 install yamale==4.0.4

RUN useradd -ms /bin/bash poe && chown -R poe:poe /home/poe/
COPY --from=builder /builder/ /home/poe/app
WORKDIR /home/poe/app
RUN  npm install -g . 
USER poe
EXPOSE 3000
ENTRYPOINT ["poe", "server"]