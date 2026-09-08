import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SessionGuard } from './auth.controller';
import { AdminRequest } from './auth.service';
import { CmsService } from './cms.service';
@Controller('admin/cms')
@UseGuards(SessionGuard)
export class CmsController {
  constructor(private readonly cms: CmsService) {}
  @Get('catalog') catalog(@Req() req: AdminRequest) {
    return this.cms.catalog(req.admin);
  }
  @Get('dashboard') dashboard(@Req() req: AdminRequest) {
    return this.cms.dashboard(req.admin);
  }
  @Get('seo-locales') seoLocales(
    @Req() req: AdminRequest,
    @Query('slug') slug: string,
  ) {
    return this.cms.seoLocales(req.admin, slug);
  }
  @Get(':module') list(
    @Req() req: AdminRequest,
    @Param('module') key: string,
    @Query('page') page?: string,
  ) {
    return this.cms.list(req.admin, key, page ? Number(page) : 1);
  }
  @Get(':module/choices') choices(
    @Req() req: AdminRequest,
    @Param('module') key: string,
    @Query('search') search?: string,
  ) {
    return this.cms.choices(req.admin, key, search);
  }
  @Get(':module/:id') get(
    @Req() req: AdminRequest,
    @Param('module') key: string,
    @Param('id') id: string,
  ) {
    return this.cms.get(req.admin, key, id);
  }
  @Post(':module') create(
    @Req() req: AdminRequest,
    @Param('module') key: string,
    @Body() body: unknown,
  ) {
    return this.cms.save(req.admin, key, undefined, body);
  }
  @Put(':module/:id') update(
    @Req() req: AdminRequest,
    @Param('module') key: string,
    @Param('id') id: string,
    @Body() body: unknown,
  ) {
    return this.cms.save(req.admin, key, id, body);
  }
  @Delete(':module/:id') remove(
    @Req() req: AdminRequest,
    @Param('module') key: string,
    @Param('id') id: string,
    @Query('version') version: string,
  ) {
    return this.cms.remove(req.admin, key, id, version);
  }
}
