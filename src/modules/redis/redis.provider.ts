import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

export const RedisProvider = {
    provide: 'REDIS-CLIENT',
    inject: [ConfigService],
    useFactory: (configService: ConfigService) => {
        return new Redis({
            host: configService.get<string>('REDIS_HOST'),
            port: Number(configService.get<string>('REDIS_PORT')),
        })
    }
}