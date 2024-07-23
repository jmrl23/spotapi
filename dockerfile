FROM node:22-alpine

WORKDIR /app

COPY . .

RUN yarn install
RUN yarn run prisma db push
RUN yarn run build

ENV NODE_ENV=production

ENTRYPOINT [ "node" ]

CMD [ "." ]