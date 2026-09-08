import { contactClientIp } from '../contact-security';
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { NewsletterService } from './newsletter.service';
import { NewsletterSubscribeDto, NewsletterTokenDto } from './newsletter.dto';
@Controller('newsletter')
@Throttle({
  default: {
    limit: 10,
    ttl: 60000,
    getTracker: async (req) =>
      contactClientIp(
        req as import('express').Request,
        process.env.CONTACT_PROXY_SECRET,
      ),
  },
})
export class NewsletterController {
  constructor(private readonly newsletter: NewsletterService) {}
  @Post('subscribe')
  @HttpCode(202)
  subscribe(@Body() dto: NewsletterSubscribeDto) {
    return this.newsletter.subscribe(dto);
  }
  @Post('confirm')
  @HttpCode(200)
  confirm(@Body() dto: NewsletterTokenDto) {
    return this.newsletter.confirm(dto.token);
  }
  @Post('unsubscribe')
  @HttpCode(200)
  unsubscribe(@Body() dto: NewsletterTokenDto) {
    return this.newsletter.unsubscribe(dto.token);
  }
}
