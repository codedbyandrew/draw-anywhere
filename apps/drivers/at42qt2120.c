#include "../include/at42qt2120.h"

// File handle for I2C /dev entry
static int i2c_fh;

//*****************************************************************************
// Use the GPIO_OUT_REG pins connected to the AT23QT2120 reset line to hold the 
// AT23QT2120 in reset by setting the pin low 
//*****************************************************************************
static void at42qt2120_assert_reset(void)
{
  
  // read the currnet value of the GPIO_OUT_REG

  // Clear RST to be 0
  
  // Write the value back out 
  
}

//*****************************************************************************
// Use the GPIO port connected to the AT23QT2120 reset line to bring the 
// AT23QT2120 out of reset by setting the pin high
//*****************************************************************************
static void at42qt2120_deassert_reset(void)
{
  // read the currnet value of the GPIO_OUT_REG


  // Set RST to be 1

  sleep(1);
 
  // Write the value back out 
 
}

//*****************************************************************************
//*****************************************************************************
static void at42qt2120_set_slave_address(void)
{
	if (ioctl(i2c_fh, I2C_SLAVE, AT42QT2120_SLAVE_ADDR) < 0) {
		perror("Error setting slave address");
		exit(1);
	}
}


//*****************************************************************************
//*****************************************************************************
void at42qt2120_open(void)
{
	i2c_fh = open(I2C_DEV, O_RDWR);
	if (i2c_fh < 0) {
		perror("i2c_open failed");
		exit(1);
	}

  // bring the at42qt2120 out of reset
  at42qt2120_deassert_reset();

  // Set the slave address for the at42qt2120
  at42qt2120_set_slave_address();

}

//*****************************************************************************
//*****************************************************************************
void at42qt2120_close(void)
{
  close(i2c_fh);

  // hold the at42qt2120 in reset
  at42qt2120_assert_reset();
}

//*****************************************************************************
// Writes one byte of data to the I2C bus.
//
// Note:  The slave address is already set using the at42qt2120_open() function.
//*****************************************************************************
void at42qt2120_write(uint8_t reg, uint8_t value)
{
}

//*****************************************************************************
// Reads one byte of data from the I2C bus.
//
// Note:  The slave address is already set using the at42qt2120_open() function.
//*****************************************************************************
uint8_t at42qt2120_read(uint8_t reg)
{
}
