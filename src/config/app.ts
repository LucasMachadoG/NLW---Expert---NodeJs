import fastify from "fastify";
import { createPoll } from "../http/routes/create.poll";
import { getPoll } from "../http/routes/get.poll";
import { voteOnPoll } from "../http/routes/vote.on.poll";
import { createUser } from "../http/routes/create.user";
import websocket from '@fastify/websocket'
import { pollResults } from "../http/ws/poll.result";

export const app = fastify()

app.register(websocket)

app.register(createPoll)
app.register(getPoll)
app.register(voteOnPoll)
app.register(createUser)
app.register(pollResults)