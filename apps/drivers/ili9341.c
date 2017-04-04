/**  
 * |----------------------------------------------------------------------
 * | Copyright (C) Tilen Majerle, 2014
 * | 
 * | This program is free software: you can redistribute it and/or modify
 * | it under the terms of the GNU General Public License as published by
 * | the Free Software Foundation, either version 3 of the License, or
 * | any later version.
 * |  
 * | This program is distributed in the hope that it will be useful,
 * | but WITHOUT ANY WARRANTY; without even the implied warranty of
 * | MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * | GNU General Public License for more details.
 * | 
 * | You should have received a copy of the GNU General Public License
 * | along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * |----------------------------------------------------------------------
 */
#include "../include/ili9341.h"

static int spi_fd;
static int gpio_fd;
static uint8_t     spi_mode;
static uint8_t     spi_bits;
static uint32_t    spi_speed;
static uint16_t    spi_delay;

uint16_t ILI9341_x;
uint16_t ILI9341_y;
TM_ILI931_Options_t ILI9341_Opts;
uint8_t ILI9341_INT_CalledFromPuts = 0;

void TM_ILI9341_InitLCD(void);
void TM_ILI9341_SendData(uint8_t data);
void TM_ILI9341_SendCommand(uint8_t data);
void TM_ILI9341_Delay(volatile unsigned int delay);
void TM_ILI9341_SetCursorPosition(uint16_t x1, uint16_t y1, uint16_t x2, uint16_t y2);


//*****************************************************************************
//*****************************************************************************
static void pabort(const char *s)
{
	perror(s);
	abort();
}

//*****************************************************************************
// Use the GPIO port connected to the LCD Reset line to hold the 
// LCD in reset.  The signal is active low.  
//*****************************************************************************
static void ili9341_rst_reset(void)
{
  // Read the current value of the GPIO_OUT_REG

  // Set RST to be 0
  
  // Write the value back out 
  
}

//*****************************************************************************
// Use the GPIO port connected to the LCD Reset line to bring the 
// LCD out of reset by setting the pin high
//*****************************************************************************
static void ili9341_rst_set(void)
{
 
  // Read the current value of the GPIO_OUT_REG

  // Set RST to be 1
  
  // Write the value back out 
  
}

//*****************************************************************************
// The LCD can be put into command mode by writing a 0 to the CMD pin.  
// In command mode, you can set the active page or column.
//*****************************************************************************
static void ili9341_cmd_reset(void)
{
  // Read the current value of the GPIO_OUT_REG

  // Set CMD to be 0
  
  // Write the value back out 
}

//*****************************************************************************
// Turn OFF command mode by writeing a 1 to the CMD pin
//
// When the LCD is not in command command mode, any data that is written over
// the SPI interface is treated as data to turn ON/OFF pixels at the location
// indicated by the currently active page and column.
//*****************************************************************************
static void ili9341_cmd_set(void)
{
  // Read the current value of the GPIO_OUT_REG

  // Set CMD to be 1
  
  // Write the value back out 
}

//*****************************************************************************
// Enable LCD backlight
//*****************************************************************************
void ili9341_bl_reset(void)
{
  // Read the current value of the GPIO_OUT_REG

  // Set Back Light to be 0
  
  // Write the value back out 
}

//*****************************************************************************
// Enable LCD backlight
//*****************************************************************************
void ili9341_bl_set(void)
{
  // Read the current value of the GPIO_OUT_REG

  // Set Back Light to be 1
  
  // Write the value back out 

}

//*****************************************************************************
// Transfer SPI data 
//*****************************************************************************
static void spi_tx_byte(uint8_t *tx)
{
  int ret;
  uint8_t rx = 0;
  struct spi_ioc_transfer tr = {
  	.tx_buf = (unsigned long)tx,
  	.rx_buf = (unsigned long)rx,
  	.len = 1,
  	.delay_usecs = spi_delay,
  	.speed_hz = spi_speed,
  	.bits_per_word = spi_bits,
  };
  
  ret = ioctl(spi_fd, SPI_IOC_MESSAGE(1), &tr);
  if (ret < 1)
  	pabort("can't send spi message");
}

//*****************************************************************************
//*****************************************************************************
void TM_ILI9341_InitLCD(void) {
  ILI9341_RST_SET;
  
  TM_ILI9341_SendCommand(ILI9341_RESET);
  TM_ILI9341_Delay(2000000);
  
  TM_ILI9341_SendCommand(ILI9341_POWERA);
  TM_ILI9341_SendData(0x39);
  TM_ILI9341_SendData(0x2C);
  TM_ILI9341_SendData(0x00);
  TM_ILI9341_SendData(0x34);
  TM_ILI9341_SendData(0x02);
  TM_ILI9341_SendCommand(ILI9341_POWERB);
  TM_ILI9341_SendData(0x00);
  TM_ILI9341_SendData(0xC1);
  TM_ILI9341_SendData(0x30);
  TM_ILI9341_SendCommand(ILI9341_DTCA);
  TM_ILI9341_SendData(0x85);
  TM_ILI9341_SendData(0x00);
  TM_ILI9341_SendData(0x78);
  TM_ILI9341_SendCommand(ILI9341_DTCB);
  TM_ILI9341_SendData(0x00);
  TM_ILI9341_SendData(0x00);
  TM_ILI9341_SendCommand(ILI9341_POWER_SEQ);
  TM_ILI9341_SendData(0x64);
  TM_ILI9341_SendData(0x03);
  TM_ILI9341_SendData(0x12);
  TM_ILI9341_SendData(0x81);
  TM_ILI9341_SendCommand(ILI9341_PRC);
  TM_ILI9341_SendData(0x20);
  TM_ILI9341_SendCommand(ILI9341_POWER1);
  TM_ILI9341_SendData(0x23);
  TM_ILI9341_SendCommand(ILI9341_POWER2);
  TM_ILI9341_SendData(0x10);
  TM_ILI9341_SendCommand(ILI9341_VCOM1);
  TM_ILI9341_SendData(0x3E);
  TM_ILI9341_SendData(0x28);
  TM_ILI9341_SendCommand(ILI9341_VCOM2);
  TM_ILI9341_SendData(0x86);
  TM_ILI9341_SendCommand(ILI9341_MAC);
  TM_ILI9341_SendData(0x48);
  TM_ILI9341_SendCommand(ILI9341_PIXEL_FORMAT);
  TM_ILI9341_SendData(0x55);
  TM_ILI9341_SendCommand(ILI9341_FRC);
  TM_ILI9341_SendData(0x00);
  TM_ILI9341_SendData(0x18);
  TM_ILI9341_SendCommand(ILI9341_DFC);
  TM_ILI9341_SendData(0x08);
  TM_ILI9341_SendData(0x82);
  TM_ILI9341_SendData(0x27);
  TM_ILI9341_SendCommand(ILI9341_3GAMMA_EN);
  TM_ILI9341_SendData(0x00);
  TM_ILI9341_SendCommand(ILI9341_COLUMN_ADDR);
  TM_ILI9341_SendData(0x00);
  TM_ILI9341_SendData(0x00);
  TM_ILI9341_SendData(0x00);
  TM_ILI9341_SendData(0xEF);
  TM_ILI9341_SendCommand(ILI9341_PAGE_ADDR);
  TM_ILI9341_SendData(0x00);
  TM_ILI9341_SendData(0x00);
  TM_ILI9341_SendData(0x01);
  TM_ILI9341_SendData(0x3F);
  TM_ILI9341_SendCommand(ILI9341_GAMMA);
  TM_ILI9341_SendData(0x01);
  TM_ILI9341_SendCommand(ILI9341_PGAMMA);
  TM_ILI9341_SendData(0x0F);
  TM_ILI9341_SendData(0x31);
  TM_ILI9341_SendData(0x2B);
  TM_ILI9341_SendData(0x0C);
  TM_ILI9341_SendData(0x0E);
  TM_ILI9341_SendData(0x08);
  TM_ILI9341_SendData(0x4E);
  TM_ILI9341_SendData(0xF1);
  TM_ILI9341_SendData(0x37);
  TM_ILI9341_SendData(0x07);
  TM_ILI9341_SendData(0x10);
  TM_ILI9341_SendData(0x03);
  TM_ILI9341_SendData(0x0E);
  TM_ILI9341_SendData(0x09);
  TM_ILI9341_SendData(0x00);
  TM_ILI9341_SendCommand(ILI9341_NGAMMA);
  TM_ILI9341_SendData(0x00);
  TM_ILI9341_SendData(0x0E);
  TM_ILI9341_SendData(0x14);
  TM_ILI9341_SendData(0x03);
  TM_ILI9341_SendData(0x11);
  TM_ILI9341_SendData(0x07);
  TM_ILI9341_SendData(0x31);
  TM_ILI9341_SendData(0xC1);
  TM_ILI9341_SendData(0x48);
  TM_ILI9341_SendData(0x08);
  TM_ILI9341_SendData(0x0F);
  TM_ILI9341_SendData(0x0C);
  TM_ILI9341_SendData(0x31);
  TM_ILI9341_SendData(0x36);
  TM_ILI9341_SendData(0x0F);
  TM_ILI9341_SendCommand(ILI9341_SLEEP_OUT);

  TM_ILI9341_Delay(1000000);

  TM_ILI9341_SendCommand(ILI9341_DISPLAY_ON);
  TM_ILI9341_SendCommand(ILI9341_GRAM);
}

//*****************************************************************************
//*****************************************************************************
static void TM_ILI9341_Init() {

  ILI9341_BL_SET;

  TM_ILI9341_InitLCD();  
  
  ILI9341_x = ILI9341_y = 0;
  
  ILI9341_Opts.width = ILI9341_WIDTH;
  ILI9341_Opts.height = ILI9341_HEIGHT;
  ILI9341_Opts.orientation = TM_ILI9341_Landscape;
  
  TM_ILI9341_Rotate(TM_ILI9341_Landscape);
  TM_ILI9341_Fill(ILI9341_COLOR_WHITE);
}


//*****************************************************************************
// Initialize the LCD peripheral
//*****************************************************************************
void TM_ILI9341_Open(
  char        *device, 
  uint8_t     mode,
  uint8_t     bits,
  uint32_t    speed,
  uint16_t    delay
)
{
 
  int ret;
  spi_delay = delay;
 
  // Configure the SPI Interface	
  spi_fd = open(device, O_RDWR);
  if (spi_fd < 0)
  	pabort("can't open device");
  
  /*
   * spi mode
   */
  ret = ioctl(spi_fd, SPI_IOC_WR_MODE, &mode);
  if (ret == -1)
  	pabort("can't set spi mode");
  
  ret = ioctl(spi_fd, SPI_IOC_RD_MODE, &spi_mode);
  if (ret == -1)
  	pabort("can't get spi mode");
  
  /*
   * bits per word
   */
  ret = ioctl(spi_fd, SPI_IOC_WR_BITS_PER_WORD, &bits);
  if (ret == -1)
  	pabort("can't set bits per word");
  
  ret = ioctl(spi_fd, SPI_IOC_RD_BITS_PER_WORD, &spi_bits);
  if (ret == -1)
  	pabort("can't get bits per word");
 
  printf("Speed = %i\n\r",speed); 
  /*
   * max speed hz
   */
  ret = ioctl(spi_fd, SPI_IOC_WR_MAX_SPEED_HZ, &speed);
  if (ret == -1)
  	pabort("can't set max speed hz");
  
  ret = ioctl(spi_fd, SPI_IOC_RD_MAX_SPEED_HZ, &spi_speed);
  if (ret == -1)
  	pabort("can't get max speed hz");
  
  printf("spi mode: %d\n", spi_mode);
  printf("bits per word: %d\n", spi_bits);
  printf("max speed: %d Hz (%d KHz)\n", spi_speed, spi_speed/1000);

  // Initialize the LCD to the correct mode and clear the screen
  TM_ILI9341_Init();	
}


//*****************************************************************************
// Initialize the LCD peripheral
//*****************************************************************************
void TM_ILI9341_Close(void)
{
  close(spi_fd);
}

void TM_ILI9341_SendCommand(uint8_t data) {
  ILI9341_CMD_SEL_RESET;
  spi_tx_byte(&data);
}

void TM_ILI9341_SendData(uint8_t data) {
  ILI9341_CMD_SEL_SET;
  spi_tx_byte(&data);
}

void TM_ILI9341_DrawPixel(uint16_t x, uint16_t y, uint32_t color) {
  TM_ILI9341_SetCursorPosition(x, y, x, y);

  TM_ILI9341_SendCommand(ILI9341_GRAM);
  TM_ILI9341_SendData(color >> 8);
  TM_ILI9341_SendData(color & 0xFF);
}


void TM_ILI9341_SetCursorPosition(uint16_t x1, uint16_t y1, uint16_t x2, uint16_t y2) {
  TM_ILI9341_SendCommand(ILI9341_COLUMN_ADDR);
  TM_ILI9341_SendData(x1 >> 8);
  TM_ILI9341_SendData(x1 & 0xFF);
  TM_ILI9341_SendData(x2 >> 8);
  TM_ILI9341_SendData(x2 & 0xFF);

  TM_ILI9341_SendCommand(ILI9341_PAGE_ADDR);
  TM_ILI9341_SendData(y1 >> 8);
  TM_ILI9341_SendData(y1 & 0xFF);
  TM_ILI9341_SendData(y2 >> 8);
  TM_ILI9341_SendData(y2 & 0xFF);
}

void TM_ILI9341_Fill(uint32_t color) {
  unsigned int n, i, j;
  i = color >> 8;
  j = color & 0xFF;
  TM_ILI9341_SetCursorPosition(0, 0, ILI9341_Opts.width - 1, ILI9341_Opts.height - 1);

  TM_ILI9341_SendCommand(ILI9341_GRAM);

  for (n = 0; n < ILI9341_PIXEL; n++) {
    TM_ILI9341_SendData(i);
    TM_ILI9341_SendData(j);
  }
}

void TM_ILI9341_Delay(volatile unsigned int delay) {
  for (; delay != 0; delay--); 
}

void TM_ILI9341_Rotate(TM_ILI9341_Orientation_t orientation) {
  TM_ILI9341_SendCommand(ILI9341_MAC);
  if (orientation == TM_ILI9341_Orientation_Portrait_1) {
    TM_ILI9341_SendData(0x58);
  } else if (orientation == TM_ILI9341_Orientation_Portrait_2) {
    TM_ILI9341_SendData(0x88);
  } else if (orientation == TM_ILI9341_Orientation_Landscape_1) {
    TM_ILI9341_SendData(0x28);
  } else if (orientation == TM_ILI9341_Orientation_Landscape_2) {
    TM_ILI9341_SendData(0xE8);
  }
  
  if (orientation == TM_ILI9341_Orientation_Portrait_1 || orientation == TM_ILI9341_Orientation_Portrait_2) {
    ILI9341_Opts.width = ILI9341_WIDTH;
    ILI9341_Opts.height = ILI9341_HEIGHT;
    ILI9341_Opts.orientation = TM_ILI9341_Portrait;
  } else {
    ILI9341_Opts.width = ILI9341_HEIGHT;
    ILI9341_Opts.height = ILI9341_WIDTH;
    ILI9341_Opts.orientation = TM_ILI9341_Landscape;
  }
}

void TM_ILI9341_Puts(uint16_t x, uint16_t y, char *str, TM_FontDef_t *font, uint32_t foreground, uint32_t background) {
  uint16_t startX = x;
  
  /* Set X and Y coordinates */
  ILI9341_x = x;
  ILI9341_y = y;
  
  while (*str) {
    //New line
    if (*str == '\n') {
      ILI9341_y += font->FontHeight + 1;
      //if after \n is also \r, than go to the left of the screen
      if (*(str + 1) == '\r') {
        ILI9341_x = 0;
        str++;
      } else {
        ILI9341_x = startX;
      }
      str++;
      continue;
    } else if (*str == '\r') {
      str++;
      continue;
    }
    
    TM_ILI9341_Putc(ILI9341_x, ILI9341_y, *str++, font, foreground, background);
  }
}

void TM_ILI9341_GetStringSize(char *str, TM_FontDef_t *font, uint16_t *width, uint16_t *height) {
  uint16_t w = 0;
  *height = font->FontHeight;
  while (*str++) {
    w += font->FontWidth;
  }
  *width = w;
}

void TM_ILI9341_Putc(uint16_t x, uint16_t y, char c, TM_FontDef_t *font, uint32_t foreground, uint32_t background) {
  uint32_t i, b, j;
  /* Set coordinates */
  ILI9341_x = x;
  ILI9341_y = y;
  if ((ILI9341_x + font->FontWidth) > ILI9341_Opts.width) {
    //If at the end of a line of display, go to new line and set x to 0 position
    ILI9341_y += font->FontHeight;
    ILI9341_x = 0;
  }
  for (i = 0; i < font->FontHeight; i++) {
    b = font->data[(c - 32) * font->FontHeight + i];
    for (j = 0; j < font->FontWidth; j++) {
      if ((b << j) & 0x8000) {
        TM_ILI9341_DrawPixel(ILI9341_x + j, (ILI9341_y + i), foreground);
      } else if ((background & ILI9341_TRANSPARENT) == 0) {
        TM_ILI9341_DrawPixel(ILI9341_x + j, (ILI9341_y + i), background);
      }
    }
  }
  ILI9341_x += font->FontWidth;
}


void TM_ILI9341_DrawLine(uint16_t x0, uint16_t y0, uint16_t x1, uint16_t y1, uint32_t color) {
  /* Code by dewoller: https://github.com/dewoller */
  
  int16_t dx, dy, sx, sy, err, e2; 
  
  /* Check for overflow */
  if (x0 >= ILI9341_Opts.width) {
    x0 = ILI9341_Opts.width - 1;
  }
  if (x1 >= ILI9341_Opts.width) {
    x1 = ILI9341_Opts.width - 1;
  }
  if (y0 >= ILI9341_Opts.height) {
    y0 = ILI9341_Opts.height - 1;
  }
  if (y1 >= ILI9341_Opts.height) {
    y1 = ILI9341_Opts.height - 1;
  }
  
  dx = (x0 < x1) ? (x1 - x0) : (x0 - x1); 
  dy = (y0 < y1) ? (y1 - y0) : (y0 - y1); 
  sx = (x0 < x1) ? 1 : -1; 
  sy = (y0 < y1) ? 1 : -1; 
  err = ((dx > dy) ? dx : -dy) / 2; 

  while (1) {
    TM_ILI9341_DrawPixel(x0, y0, color); 
    if (x0 == x1 && y0 == y1) {
      break;
    }
    e2 = err; 
    if (e2 > -dx) {
      err -= dy;
      x0 += sx;
    } 
    if (e2 < dy) {
      err += dx;
      y0 += sy;
    } 
  }
}

void TM_ILI9341_DrawRectangle(uint16_t x0, uint16_t y0, uint16_t x1, uint16_t y1, uint32_t color) {
  TM_ILI9341_DrawLine(x0, y0, x1, y0, color); //Top
  TM_ILI9341_DrawLine(x0, y0, x0, y1, color);  //Left
  TM_ILI9341_DrawLine(x1, y0, x1, y1, color);  //Right
  TM_ILI9341_DrawLine(x0, y1, x1, y1, color);  //Bottom
}

void TM_ILI9341_DrawFilledRectangle(uint16_t x0, uint16_t y0, uint16_t x1, uint16_t y1, uint32_t color) {
  for (; y0 < y1; y0++) {
    TM_ILI9341_DrawLine(x0, y0, x1, y0, color);
  }
}

void TM_ILI9341_DrawCircle(int16_t x0, int16_t y0, int16_t r, uint32_t color) {
  int16_t f = 1 - r;
  int16_t ddF_x = 1;
  int16_t ddF_y = -2 * r;
  int16_t x = 0;
  int16_t y = r;

    TM_ILI9341_DrawPixel(x0, y0 + r, color);
    TM_ILI9341_DrawPixel(x0, y0 - r, color);
    TM_ILI9341_DrawPixel(x0 + r, y0, color);
    TM_ILI9341_DrawPixel(x0 - r, y0, color);

    while (x < y) {
        if (f >= 0) {
            y--;
            ddF_y += 2;
            f += ddF_y;
        }
        x++;
        ddF_x += 2;
        f += ddF_x;

        TM_ILI9341_DrawPixel(x0 + x, y0 + y, color);
        TM_ILI9341_DrawPixel(x0 - x, y0 + y, color);
        TM_ILI9341_DrawPixel(x0 + x, y0 - y, color);
        TM_ILI9341_DrawPixel(x0 - x, y0 - y, color);

        TM_ILI9341_DrawPixel(x0 + y, y0 + x, color);
        TM_ILI9341_DrawPixel(x0 - y, y0 + x, color);
        TM_ILI9341_DrawPixel(x0 + y, y0 - x, color);
        TM_ILI9341_DrawPixel(x0 - y, y0 - x, color);
    }
}

void TM_ILI9341_DrawFilledCircle(int16_t x0, int16_t y0, int16_t r, uint32_t color) {
  int16_t f = 1 - r;
  int16_t ddF_x = 1;
  int16_t ddF_y = -2 * r;
  int16_t x = 0;
  int16_t y = r;

    TM_ILI9341_DrawPixel(x0, y0 + r, color);
    TM_ILI9341_DrawPixel(x0, y0 - r, color);
    TM_ILI9341_DrawPixel(x0 + r, y0, color);
    TM_ILI9341_DrawPixel(x0 - r, y0, color);
    TM_ILI9341_DrawLine(x0 - r, y0, x0 + r, y0, color);

    while (x < y) {
        if (f >= 0) {
            y--;
            ddF_y += 2;
            f += ddF_y;
        }
        x++;
        ddF_x += 2;
        f += ddF_x;

        TM_ILI9341_DrawLine(x0 - x, y0 + y, x0 + x, y0 + y, color);
        TM_ILI9341_DrawLine(x0 + x, y0 - y, x0 - x, y0 - y, color);

        TM_ILI9341_DrawLine(x0 + y, y0 + x, x0 - y, y0 + x, color);
        TM_ILI9341_DrawLine(x0 + y, y0 - x, x0 - y, y0 - x, color);
    }
}
