import z from "zod";
import { app } from "../../config/app";
import { prisma } from "../../lib/prisma.connection";
import { redis } from "../../lib/redis.connection";
import { voting } from "../../utils/voting.pub.sub";

export async function voteOnPoll(){
  app.post('/user/:userId/polls/:pollId/votes', async (request, reply) => {
    const getUserIdParamsSchema = z.object({
      userId: z.string().uuid()
    })

    const voteOnPollBodySchema = z.object({
      pollOptionId: z.string().uuid()
    })

    const voteOnPollParamsSchema = z.object({
      pollId: z.string().uuid()
    })

    const { userId } = getUserIdParamsSchema.parse(request.params)
    const { pollOptionId } = voteOnPollBodySchema.parse(request.body)
    const { pollId } = voteOnPollParamsSchema.parse(request.params)

    const user = await prisma.user.findUnique({
      where: {
        id: userId
      }
    })

    if(!user){
      return reply.status(404).send({
        ok: false,
        message: 'Usuário não encontrado!'
      })
    }

    const poll = await prisma.poll.findUnique({
      where: {
        id: pollId
      }
    })

    if(!poll){
      return reply.status(404).send({
        ok: false,
        message: 'Poll não encontrado!'
      })
    }

    const optionPoll = await prisma.pollOption.findUnique({
      where: {
        id: pollOptionId
      }
    })

    if(!optionPoll){
      return reply.status(404).send({
        ok: false,
        message: 'Option não encontrada!'
      })
    } 

    const optionAlreadyVoted = await prisma.vote.findFirst({
      where: {
        userId: userId,
        pollId: pollId
      }
    })

    if(optionAlreadyVoted && optionAlreadyVoted.pollOptionId !== pollOptionId){
      await prisma.vote.delete({
        where: {
          id: optionAlreadyVoted.id
        }
      })

      const votes = await redis.zincrby(pollId, -1, optionAlreadyVoted.pollOptionId)

      voting.publish(pollId, {
        pollOptionId: optionAlreadyVoted.pollOptionId,
        votes: Number(votes)
      })
    }else if(optionAlreadyVoted){
      return reply.status(401).send({
        ok: false,
        message: 'Voce já votou nessa enquete!'
      })
    }

    await prisma.vote.create({
      data: {
        userId: userId,
        pollId: pollId,
        pollOptionId: pollOptionId
      }
    })

    const votes =await redis.zincrby(pollId, 1, pollOptionId)

    voting.publish(pollId, {
      pollOptionId,
      votes: Number(votes)
    })

    return reply.status(201).send({
      ok: true,
      message: 'Votação feita com sucesso!'
    })
  })
}