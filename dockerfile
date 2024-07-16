FROM node:22-alpine

WORKDIR /app

COPY . .

ENV NODE_ENV=production

RUN yarn install

ENTRYPOINT [ "node" ]

CMD [ "." ]