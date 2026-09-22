import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginRequestDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiResponse } from '@mmedic/types';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión de usuario y obtener token JWT' })
  @SwaggerResponse({ status: 200, description: 'Autenticación exitosa' })
  async login(@Body() loginDto: LoginRequestDto): Promise<ApiResponse<any>> {
    const data = await this.authService.login(loginDto);
    return {
      success: true,
      data,
      message: 'Inicio de sesión exitoso',
      timestamp: new Date().toISOString(),
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Consultar el perfil del usuario en sesión' })
  @SwaggerResponse({ status: 200, description: 'Perfil de usuario obtenido' })
  async getProfile(@Request() req: any): Promise<ApiResponse<any>> {
    const data = await this.authService.validateUserById(req.user.id);
    return {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    };
  }
}
