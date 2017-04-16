/*
 */

#ifndef __ECE453_APP_H__
#define __ECE453_APP_H__

#include <string.h>
#include <stdint.h>
#include <unistd.h>
#include <stdio.h>
#include <stdlib.h>
#include <getopt.h>
#include <fcntl.h>
#include <sys/ioctl.h>
#include <linux/types.h>

#define CONTROL_REG	"/sys/kernel/ece453/control"
#define DEVICE_ID_REG	"/sys/kernel/ece453/device_id"
#define GPIO_IN_REG	"/sys/kernel/ece453/gpio_in"
#define GPIO_OUT_REG	"/sys/kernel/ece453/gpio_out"
#define IM_REG		"/sys/kernel/ece453/interrupt_mask"
#define IRQ_REG		"/sys/kernel/ece453/irq"
#define PID_REG		"/sys/kernel/ece453/pid"
#define STATUS_REG	"/sys/kernel/ece453/status"
#define UNUSED_REG	"/sys/kernel/ece453/unused"
#define WS2812_0_REG	"/sys/kernel/ece453/ws2812b0"
#define WS2812_1_REG	"/sys/kernel/ece453/ws2812b1"
#define WS2812_2_REG	"/sys/kernel/ece453/ws2812b2"
#define WS2812_3_REG	"/sys/kernel/ece453/ws2812b3"
#define WS2812_4_REG	"/sys/kernel/ece453/ws2812b4"
#define WS2812_5_REG	"/sys/kernel/ece453/ws2812b5"
#define WS2812_6_REG	"/sys/kernel/ece453/ws2812b6"
#define WS2812_7_REG	"/sys/kernel/ece453/ws2812b7"

//*******************************************************************
// Register Addresses
//*******************************************************************
#define ECE453_DEV_ID_OFFSET    0
#define ECE453_CONTROL_OFFSET   1
#define ECE453_STATUS_OFFSET    2
#define ECE453_IM_OFFSET        3
#define ECE453_IRQ_OFFSET       4
#define ECE453_GPIO_IN_OFFSET   5
#define ECE453_GPIO_OUT_OFFSET  6
#define ECE453_UNUSED_OFFSET    7
#define ECE453_WS2812B_0_OFFSET 8
#define ECE453_WS2812B_1_OFFSET 9
#define ECE453_WS2812B_2_OFFSET 10
#define ECE453_WS2812B_3_OFFSET 11
#define ECE453_WS2812B_4_OFFSET 12
#define ECE453_WS2812B_5_OFFSET 13
#define ECE453_WS2812B_6_OFFSET 14
#define ECE453_WS2812B_7_OFFSET 15

//*******************************************************************
// Register Bit definitions
//*******************************************************************
#define GPIO_OUT_LEDS_BIT_NUM               0
#define GPIO_OUT_LEDS_MASK                  (0x3FF << GPIO_OUT_LEDS_BIT_NUM)
#define GPIO_OUT_CAP_SEN_RST_BIT_NUM        27
#define GPIO_OUT_CAP_SEN_RST_MASK           (0x1 << GPIO_OUT_CAP_SEN_RST_BIT_NUM)
#define GPIO_OUT_LCD_RST_BIT_NUM            28
#define GPIO_OUT_LCD_RST_MASK               (0x1 << GPIO_OUT_LCD_RST_BIT_NUM)
#define GPIO_OUT_LCD_BCK_LITE_BIT_NUM       29
#define GPIO_OUT_LCD_BCK_LITE_MASK          (0x1 << GPIO_OUT_LCD_BCK_LITE_BIT_NUM)
#define GPIO_OUT_LCD_CMD_BIT_NUM            30
#define GPIO_OUT_LCD_CMD_MASK               (0x1 << GPIO_OUT_LCD_CMD_BIT_NUM)
#define GPIO_OUT_WS2812B_OUT_BIT_NUM        31
#define GPIO_OUT_WS2812B_OUT_MASK           (0x1 << GPIO_OUT_WS2812B_OUT_BIT_NUM)

#define GPIO_IN_SWITCHES_BIT_NUM            0
#define GPIO_IN_SWITCHES_MASK               (0x3FF << GPIO_IN_SWITCHES_BIT_NUM)
#define GPIO_IN_BUTTONS_BIT_NUM             10
#define GPIO_IN_BUTTONS_MASK                (0xF << GPIO_IN_BUTTONS_BIT_NUM)
#define GPIO_IN_CAP_SEN_IRQ_BIT_NUM         14
#define GPIO_IN_CAP_SEN_IRQ_MASK            (0x1 << GPIO_IN_CAP_SEN_IRQ_BIT_NUM)
#define GPIO_IN_LCD_IRQ_BIT_NUM             15
#define GPIO_IN_LCD_IRQ_MASK                (0x1 << GPIO_IN_LCD_IRQ_BIT_NUM)

#define STATUS_WS2812B_BUSY_BIT_NUM         0
#define STATUS_WS2812B_BUSY_MASK            (0x1 << STATUS_WS2812B_BUSY_BIT_NUM)

#define IRQ_WS2812B_DONE_BIT_NUM            0
#define IRQ_WS2812B_DONE_MASK               (0x1 << IRQ_WS2812B_DONE_BIT_NUM)

#define CONTROL_WS2812B_START_BIT_NUM       0
#define CONTROL_WS2812B_START_MASK          (0x1 << CONTROL_WS2812B_START_BIT_NUM)

//*****************************************************************************
//*****************************************************************************
int ece453_reg_read(char *reg_name);

//*****************************************************************************
//*****************************************************************************
int ece453_reg_write(char *reg_name, int value);

#endif
