import { BadRequestException, Controller, Get, Param } from '@nestjs/common';
import { UserPreferencesService } from './user-preferences.service';

@Controller('users/:userId/preferences')
export class UserPreferencesController {
    constructor(private readonly userPreferencesService: UserPreferencesService) {}

    @Get()
    async getUserPreferences(@Param('userId') userId: string) {
        const id = userId?.trim();
        if (!id) {
            throw new BadRequestException('userId path parameter is required');
        }
        const preferences = await this.userPreferencesService.getUserPreferences(id);
        return preferences;
    }
}