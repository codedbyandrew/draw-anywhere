/*
* Draw Anywhere DE1 application
* by Andrew Lundholm
*/
#include <signal.h>
#include <stdio.h>
#include <string.h>
#include <fcntl.h>
#include <sys/types.h>
#include <unistd.h>
#include <stdbool.h>
#include <linux/spi/spidev.h>
#include <math.h>
#include <sys/stat.h>
#include <stdint.h>
#include <stdlib.h>
#include <termios.h>
#include "../include/ece453.h"

#define SPI_DEVICE		"/dev/spidev32766.0"
#define UART_DEV  "/dev/ttyS1"
#define RAW_DATA

static int spi_fd;
static int uart_fd;
static uint8_t     spi_mode;
static uint8_t     spi_bits;
static uint32_t    spi_speed;
static uint16_t    spi_delay;

//*****************************************************************************
//*****************************************************************************
static void pabort(const char *s)
{
  perror(s);
  abort();
}
//*****************************************************************************
//*****************************************************************************
// Modes:
// 0 - mouse down
// 1 - drag
// 2 - mouse up
// 3 - toggle buggon
//*****************************************************************************
void serializeToJson(int mode, int x, int y){
  printf("{\"mode\":\"");
  switch(mode){
    case 0:
    printf("down");
    printf("\",\"x\":%d,\"y\":%d", x, y);
    break;
    case 1:
    printf("drag");
    printf("\",\"x\":%d,\"y\":%d", x, y);
    break;
    case 2:
    printf("up");
    printf("\",\"x\":%d,\"y\":%d", x, y);
    break;
    case 3:
    printf("toggle\"");
    break;
    default:
    printf("UNKNOWN MODE\"");
  }
  printf("}\r\n");
}
//*****************************************************************************
void serialize(uint16_t adc[]){
  printf("{\"data\":[%d,%d,%d,%d,%d,%d,%d,%d]}\r\n",adc[0],adc[1],adc[2],adc[3],adc[4],adc[5],adc[6],adc[7]);
}
//*****************************************************************************
//*****************************************************************************
void initializeUART(){
  struct termios termInfo;

  uart_fd = open(UART_DEV, O_RDWR, 0);
  if (uart_fd == -1){
    pabort("can't open device port");
  }

  int ret;
  //Get the current options for the port
  ret = tcgetattr(uart_fd, &termInfo);
  if (ret == -1){
    pabort("can't get port options");
  }

  //disable flow control
  termInfo.c_cflag &= ~CRTSCTS;

  //baud rate
  cfsetispeed(&termInfo, B9600); //sets the input baud rate

  //enable receiver (not sure if needed)
  termInfo.c_cflag |= CREAD;

  //set no parity and character size
  termInfo.c_cflag &= ~PARENB;
  termInfo.c_cflag &= ~CSTOPB;
  termInfo.c_cflag &= ~CSIZE;
  termInfo.c_cflag |= CS8;

  //enable raw data
  cfmakeraw(&termInfo);

  //set new configuration
  ret = tcsetattr(uart_fd, TCSANOW, &termInfo);
  if (ret == -1){
    pabort("can't set port options");
  }
}
//*****************************************************************************
//*****************************************************************************
void initializeSPI(){
  uint8_t mode = 3;
  uint8_t bits = 8;
  uint32_t speed = 3400000;
  uint16_t delay = 0;

  spi_fd = open(SPI_DEVICE, O_RDWR);
  if (spi_fd < 0){
    pabort("can't open device");
  }

  int ret;
  ret = ioctl(spi_fd, SPI_IOC_WR_MODE, &mode);
  if (ret == -1){
    pabort("can't set spi mode");
  }

  ret = ioctl(spi_fd, SPI_IOC_RD_MODE, &spi_mode);
  if (ret == -1){
    pabort("can't get spi mode");
  }

  /*
  * bits per word
  */
  ret = ioctl(spi_fd, SPI_IOC_WR_BITS_PER_WORD, &bits);
  if (ret == -1){
    pabort("can't set bits per word");
  }

  ret = ioctl(spi_fd, SPI_IOC_RD_BITS_PER_WORD, &spi_bits);
  if (ret == -1){
    pabort("can't get bits per word");
  }

  ret = ioctl(spi_fd, SPI_IOC_WR_MAX_SPEED_HZ, &speed);
  if (ret == -1){
    pabort("can't set max speed hz");
  }

  ret = ioctl(spi_fd, SPI_IOC_RD_MAX_SPEED_HZ, &spi_speed);
  if (ret == -1){
    pabort("can't get max speed hz");
  }

  printf("spi mode: %d\n", spi_mode);
  printf("bits per word: %d\n", spi_bits);
  printf("max speed: %d Hz (%d KHz)\n", spi_speed, spi_speed/1000);
}
//*****************************************************************************
// Transfer SPI data
// http://www.linuxquestions.org/questions/programming-9/spi-program-using-c-857237/
//*****************************************************************************
static void spi_rx_data(uint8_t rx[])
{
  int ret;
  uint8_t tx[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF};
  struct spi_ioc_transfer tr = {
    .tx_buf = (unsigned long)tx,
    .rx_buf = (unsigned long)rx,
    .len = 2,
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
int main(int argc, char **argv)
{
  uint8_t rx[2];
  initializeSPI();
  initializeUART();
  uint8_t buffer[6];
  uint16_t adc[8];

  while (true) {

    for(int i=0; i < 8; i++){
      //usleep(250);
      double avg = 0;
      for(int j=0; j<100; j++){
        ece453_reg_write(UNUSED_REG, i);
        spi_rx_data(rx);
        //serializeToJson(1, rx[0], rx[1]);
        int val = (rx[0]-1)*8 + (rx[1]/16);
        avg = avg + val;
      }
      avg = avg / 100.0;
      double expr2 = (avg /9.923459);
      double expr3 = 74.53401;
      double expr1 = 1 + pow(expr2, expr3);
      double div = pow(expr1,0.01944856 );
      double dist = 1.127454  + (24.094956 /div);
      //printf("%d, %4.2f, %4.2f \n", i,  avg, dist);
      adc[i] = avg;
    }
    serialize(adc);

    read(uart_fd, buffer, 6);
    printf("uart rx: %d,%d,%d,%d,%d,%d\n", buffer[0],buffer[1],buffer[2],buffer[3],buffer[4],buffer[5]);
  }

  return 0;
}
