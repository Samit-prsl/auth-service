import { Inject, Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import Redis from "ioredis";

@Injectable()
export class RedisService {
    private readonly logger = new Logger(RedisService.name);

    constructor(
        @Inject('REDIS-CLIENT')
        private readonly redisClient: Redis
    ){}

    async setData(key: string,data: unknown,ttl?: number){
        try {
            const serializeData = JSON.stringify(data)
            if(ttl){
                await this.redisClient.set(key,serializeData,'EX',ttl)
            } else {
                await this.redisClient.set(key,serializeData)
            }
            this.logger.debug(`SET ${key}`);
        } catch (error) {
            this.logger.error(`Failed to SET ${key}`, error.stack);
            throw new InternalServerErrorException("Internal server error")
        }
    }

    async getData(key: string){
        const data = await this.redisClient.get(key)
        this.logger.debug(`GET ${key} => ${data ? 'hit' : 'miss'}`);
        return data ? JSON.parse(data) : null
    }

    async delData(key: string){
        this.logger.debug(`DEL ${key}`);
        return await this.redisClient.del(key)
    }

    async existsData(key: string){
        const exists = await this.redisClient.exists(key)
        this.logger.debug(`EXISTS ${key} => ${Boolean(exists)}`);
        return Boolean(exists)
    }
}