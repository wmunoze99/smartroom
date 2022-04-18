FROM node:16-slim

WORKDIR /app
COPY ./* /app/

ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS="--max-old-space-size=5120"

RUN yarn
RUN rm -rfv !("dist")

CMD ["yarn", "start"]