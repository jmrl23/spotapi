FROM node:22-alpine

WORKDIR /app

COPY . .

# update this, we'll use atlas since mongodb docker
# image is such a pain in the ass for prisma. you may
# configure it if you want, but i want this to be
# hassle-free on my end.
# and yes, this environment variable is required to be
# on the dockerfile level.
ENV DATABASE_URL=mongodb+srv://<user>:<password>@<host>/spotapi

RUN yarn install
RUN yarn run prisma db push
RUN yarn run build

ENTRYPOINT [ "node" ]

CMD [ "." ]