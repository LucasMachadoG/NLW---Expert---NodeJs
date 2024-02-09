import { FastifyInstance } from "fastify";
import { z } from 'zod'
import { prisma } from "../../lib/prisma.connection";

export async function createPoll(app: FastifyInstance){
  app.post('/user/:userId/polls', async (request, reply) => {
    const getUserIdParams = z.object({
      userId: z.string().uuid()
    })

    const createPollBodySchema = z.object({
      title: z.string(),
      options: z.array(z.string())
    })

    const { userId } = getUserIdParams.parse(request.params)

    const { title, options } = createPollBodySchema.parse(request.body)

    const user = await prisma.user.findUnique({
      where: {
        id: userId
      }
    })

    if(!user){
      return reply.status(404).send({
        message: "Usuário não encontrado!"
      })
    }

    const poll = await prisma.poll.create({
      data: {
        title,
        user: {
          connect: {
            id: userId
          }
        },
        options: {
          createMany: {
            data: options.map((option) => {
              return {
                title: option, 
              }
            })
          }
        }
      }
    })

    return reply.status(201).send({
      ok: true,
      id: poll.id
    })
  })
}