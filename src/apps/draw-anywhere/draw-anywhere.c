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
#include "../include/ece453.h"

#define PID "/sys/kernel/ece453/pid"
#define SPI_DEVICE		"/dev/spidev32766.0"

#define SIG_XBEE 52

bool busy = true;
//*****************************************************************************
// Transfer SPI data
//*****************************************************************************
static void spi_rx_byte()
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
int set_pid(void)
{

	char buf[10];
	int fd = open(PID, O_WRONLY);
	if(fd < 0) {
		perror("open");
		return -1;
	}
	sprintf(buf, "%i", getpid());
	if (write(fd, buf, strlen(buf) + 1) < 0) {
		perror("fwrite");
		return -1;
	}
  close(fd);
  return 0;
}

//*****************************************************************************
//*****************************************************************************
int clear_pid(void)
{

	char buf[10];
	int fd = open(PID, O_WRONLY);
	if(fd < 0) {
		perror("open");
		return -1;
	}

 memset(buf,0,10);
 if (write(fd, buf, strlen(buf) + 1) < 0) {
		perror("fwrite");
		return -1;
	}
  close(fd);
  return 0;
}

//*****************************************************************************
//*****************************************************************************
void control_c_handler(int n, siginfo_t *info, void *unused)
{
  clear_pid();
  ece453_reg_write(IM_REG, 0);
  busy = false;
}

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
//*****************************************************************************
void receiveData_xbee(int n, siginfo_t *info, void *unused)
{

}
//*****************************************************************************
//*****************************************************************************
int main(int argc, char **argv)
{
  char *device = SPI_DEVICE;
  uint8_t mode = 3;
  uint8_t bits = 8;
  uint32_t speed = 5000000;
  uint16_t delay = 0;

  struct sigaction xbee_sig;
  struct sigaction ctrl_c_sig;

  // Set up handler for information sent from the kernel driver
  xbee_sig.sa_sigaction = receiveData_xbee;
  xbee_sig.sa_flags = SA_SIGINFO;
  sigaction(SIG_XBEE, &xbee_sig, NULL);

  // Set up handler for when the user presses CNTL-C to stop the application
  ctrl_c_sig.sa_sigaction = control_c_handler;
  ctrl_c_sig.sa_flags = SA_SIGINFO;
  sigaction(SIGINT, &ctrl_c_sig, NULL);

  // Configure the IP module
  set_pid();

  // enable reception of a signal when the user presses KEY[0]
  // ece453_reg_write(IM_REG, KEY0);

  /* Loop forever, waiting for interrupts */
	while (busy) {
    for(int i=0; i < 8; i++){
      ece453_reg_write(CHIP_SELECT_REG, i);

    }
		sleep(86400);	/* This will end early when we get an interrupt. */
	}

  clear_pid();

  // Disalbe interrupts
  ece453_reg_write(IM_REG, 0);


  return 0;
}
