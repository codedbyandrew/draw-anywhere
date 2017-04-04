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

#define SIG_ADC_0 44
#define SIG_ADC_1 45
#define SIG_ADC_2 46
#define SIG_ADC_3 47
#define SIG_ADC_4 48
#define SIG_ADC_5 49
#define SIG_ADC_6 50
#define SIG_ADC_7 51
#define SIG_XBEE 52

bool busy = true;


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
void receiveData_adc_0(int n, siginfo_t *info, void *unused){

}
//*****************************************************************************
//*****************************************************************************
void receiveData_adc_1(int n, siginfo_t *info, void *unused){

}
//*****************************************************************************
//*****************************************************************************
void receiveData_adc_2(int n, siginfo_t *info, void *unused){

}
//*****************************************************************************
//*****************************************************************************
void receiveData_adc_3(int n, siginfo_t *info, void *unused){

}
//*****************************************************************************
//*****************************************************************************
void receiveData_adc_4(int n, siginfo_t *info, void *unused){

}
//*****************************************************************************
//*****************************************************************************
void receiveData_adc_5(int n, siginfo_t *info, void *unused){

}
//*****************************************************************************
//*****************************************************************************
void receiveData_adc_6(int n, siginfo_t *info, void *unused){

}
//*****************************************************************************
//*****************************************************************************
void receiveData_adc_7(int n, siginfo_t *info, void *unused){

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
  struct sigaction adc_0_sig;
  struct sigaction adc_1_sig;
  struct sigaction adc_2_sig;
  struct sigaction adc_3_sig;
  struct sigaction adc_4_sig;
  struct sigaction adc_5_sig;
  struct sigaction adc_6_sig;
  struct sigaction adc_7_sig;
  struct sigaction xbee_sig;
  struct sigaction ctrl_c_sig;

  // Set up handler for information sent from the kernel driver
  adc_0_sig.sa_sigaction = receiveData_adc_0;
  adc_1_sig.sa_sigaction = receiveData_adc_1;
  adc_2_sig.sa_sigaction = receiveData_adc_2;
  adc_3_sig.sa_sigaction = receiveData_adc_3;
  adc_4_sig.sa_sigaction = receiveData_adc_4;
  adc_5_sig.sa_sigaction = receiveData_adc_5;
  adc_6_sig.sa_sigaction = receiveData_adc_6;
  adc_7_sig.sa_sigaction = receiveData_adc_7;
  xbee_sig.sa_sigaction = receiveData_xbee;
  adc_0_sig.sa_flags = SA_SIGINFO;
  adc_1_sig.sa_flags = SA_SIGINFO;
  adc_2_sig.sa_flags = SA_SIGINFO;
  adc_3_sig.sa_flags = SA_SIGINFO;
  adc_4_sig.sa_flags = SA_SIGINFO;
  adc_5_sig.sa_flags = SA_SIGINFO;
  adc_6_sig.sa_flags = SA_SIGINFO;
  adc_7_sig.sa_flags = SA_SIGINFO;
  xbee_sig.sa_flags = SA_SIGINFO;
  sigaction(SIG_ADC_0, &adc_0_sig, NULL);
  sigaction(SIG_ADC_1, &adc_1_sig, NULL);
  sigaction(SIG_ADC_2, &adc_2_sig, NULL);
  sigaction(SIG_ADC_3, &adc_3_sig, NULL);
  sigaction(SIG_ADC_4, &adc_4_sig, NULL);
  sigaction(SIG_ADC_5, &adc_5_sig, NULL);
  sigaction(SIG_ADC_6, &adc_6_sig, NULL);
  sigaction(SIG_ADC_7, &adc_7_sig, NULL);
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
		sleep(86400);	/* This will end early when we get an interrupt. */
	}

  clear_pid();

  // Disalbe interrupts
  ece453_reg_write(IM_REG, 0);


  return 0;
}
