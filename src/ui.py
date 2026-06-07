import pygame

class Button:
    def __init__(self, rect, color, text, font, text_color=None, hover_color=None, border_radius=5):
        self.rect = pygame.Rect(rect)
        self.color = color
        self.text = text
        self.font = font
        self.text_color = text_color if text_color else (255, 255, 255)
        self.hover_color = hover_color if hover_color else self._lighten_color(color)
        self.border_radius = border_radius

    def _lighten_color(self, color):
        """Assombrit ou éclaircit la couleur pour l'effet de survol."""
        return tuple(min(255, c + 30) for c in color)

    def draw(self, screen):
        mouse_pos = pygame.mouse.get_pos()
        color = self.hover_color if self.rect.collidepoint(mouse_pos) else self.color
        
        pygame.draw.rect(screen, color, self.rect, border_radius=self.border_radius)
        
        txt_surface = self.font.render(self.text, True, self.text_color)
        txt_rect = txt_surface.get_rect(center=self.rect.center)
        screen.blit(txt_surface, txt_rect)

    def is_clicked(self, pos):
        return self.rect.collidepoint(pos)

    def update_text(self, new_text):
        self.text = new_text
        
    def update_rect(self, new_rect):
        self.rect = pygame.Rect(new_rect)
