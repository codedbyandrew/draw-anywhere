#include <errno.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <linux/i2c-dev.h>
#include <sys/ioctl.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>

#include "../include/ece453.h"


int main(int argc, char * argv[]) {

  // Read the device ID register
  printf("DEV_ID: 0x%08X\n\r",ece453_reg_read(DEVICE_ID_REG));

	// Write to the LEDs
	ece453_reg_write(GPIO_OUT_REG, GPIO_OUT_LEDS_MASK);
	
	printf("Press KEY[0]\n\r");
	
	while( (ece453_reg_read(GPIO_IN_REG) & (1 << GPIO_IN_BUTTONS_BIT_NUM)) != 0)
	{
	
	}

  return 0;
}
