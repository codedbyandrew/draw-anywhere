
/*

  Author:  Joe Krachey
  Date:  01/03/2017

*/


module ece453(
	// signals to connect to an Avalon clock source interface
	clk,
	reset,
	// signals to connect to an Avalon-MM slave interface
	slave_address,
	slave_read,
	slave_write,
	slave_readdata,
	slave_writedata,
	slave_byteenable,
	gpio_inputs,
	gpio_outputs,
	irq_out
);

	// most of the set values will only be used by the component .tcl file.  The DATA_WIDTH and MODE_X = 3 influence the hardware created.
	// ENABLE_SYNC_SIGNALS isn't used by this hardware at all but it provided anyway so that it can be exposed in the component .tcl file
	// to control the stubbing of certain signals.
	//parameter ENABLE_SYNC_SIGNAL	S = 0;  // only used by the component .tcl file, 1 to expose user_chipselect/write/read, 0 to stub them


	//*******************************************************************
	// Module Interface
	//*******************************************************************
	input clk;
	input reset;

	// slave interface
	input [3:0] slave_address;
	input slave_read;
	input slave_write;
	output wire [31:0] slave_readdata;
	input [31:0] slave_writedata;
	input [3:0] slave_byteenable;

	input [31:0] gpio_inputs;
	output [31:0] gpio_outputs;
	output wire irq_out;

	`include "ece453.vh"

	//*******************************************************************
	// Register Set
	//*******************************************************************
	reg  [31:0] dev_id_r;
	reg  [31:0] control_r;
	reg  [31:0] status_r;
	reg  [31:0] im_r;
	reg  [31:0] irq_r;
	reg  [31:0] gpio_in_r;
	reg  [31:0] gpio_out_r;
	reg  [31:0] chip_select_r;
	reg  [31:0] ws2812b_0_r;
	reg  [31:0] ws2812b_1_r;
	reg  [31:0] ws2812b_2_r;
	reg  [31:0] ws2812b_3_r;
	reg  [31:0] ws2812b_4_r;
	reg  [31:0] ws2812b_5_r;
	reg  [31:0] ws2812b_6_r;
	reg  [31:0] ws2812b_7_r;


	//*******************************************************************
	// Wires/Reg
	//*******************************************************************
	wire  [31:0] control_in;
	wire  [31:0] status_in;
	wire  [31:0] im_in;
	reg   [31:0] irq_in;
	wire  [31:0] gpio_in;
	wire  [31:0] gpio_out;
  wire  [31:0] chip_select_in;
	wire  [31:0] ws2812b_0_in;
	wire  [31:0] ws2812b_1_in;
	wire  [31:0] ws2812b_2_in;
	wire  [31:0] ws2812b_3_in;
	wire  [31:0] ws2812b_4_in;
	wire  [31:0] ws2812b_5_in;
	wire  [31:0] ws2812b_6_in;
	wire  [31:0] ws2812b_7_in;

  wire [7:0] receivers_out;
  wire cs_out;

	wire ws2812b_busy;
	wire neopixel_out;

	reg  [31:0] gpio_in_irqs;


	//*******************************************************************
	// Register Read Assignments
	//*******************************************************************
	assign slave_readdata = ( (slave_address == DEV_ID_ADDR )    && slave_read )	? dev_id_r :
				( (slave_address == CONTROL_ADDR )   && slave_read ) 	? control_r:
				( (slave_address == STATUS_ADDR )    && slave_read ) 	? status_r:
				( (slave_address == IM_ADDR )        && slave_read ) 	? im_r :
				( (slave_address == IRQ_ADDR )       && slave_read ) 	? irq_r :
	                        ( (slave_address == GPIO_IN_ADDR )   && slave_read ) 	? gpio_in_r :
	                        ( (slave_address == GPIO_OUT_ADDR )  && slave_read ) 	? gpio_out_r :
	                        ( (slave_address == UNUSED_ADDR )    && slave_read ) 	? chip_select_r :
	                        ( (slave_address == WS2818B_0_ADDR ) && slave_read ) 	? ws2812b_0_r :
	                        ( (slave_address == WS2818B_1_ADDR ) && slave_read ) 	? ws2812b_1_r :
	                        ( (slave_address == WS2818B_2_ADDR ) && slave_read ) 	? ws2812b_2_r :
	                        ( (slave_address == WS2818B_3_ADDR ) && slave_read ) 	? ws2812b_3_r :
	                        ( (slave_address == WS2818B_4_ADDR ) && slave_read ) 	? ws2812b_4_r :
	                        ( (slave_address == WS2818B_5_ADDR ) && slave_read ) 	? ws2812b_5_r :
	                        ( (slave_address == WS2818B_6_ADDR ) && slave_read ) 	? ws2812b_6_r : ws2812b_7_r ;


	//*******************************************************************
	// Output Assignments
	//*******************************************************************

	// IRQ indicating that an interrupt is active
	assign irq_out = | (im_r & irq_r);
	assign gpio_outputs = {gpio_out_r[31:9], cs_out, receivers_out[7:0]};

	//*******************************************************************
	// Register Input Equations
	//*******************************************************************

	// Combinational Logic for register inputs.
	always @ (*)
	begin

		gpio_in_irqs = gpio_in_r ^ gpio_inputs;
		irq_in = irq_r | gpio_in_irqs;


	   // WS2812B IRQ will get set to 1 only when ws2812b_busy changes from a 1 to a 0
		if (status_r[STATUS_WS2812B_BUSY_BIT_NUM] && !ws2812b_busy)
		begin
			irq_in = irq_in | IRQ_WS2812B_DONE_MASK;
		end

		irq_in = irq_in & im_r;

		// Determine the value of the IRQ register
		if(slave_address == IRQ_ADDR)
		begin
			if( slave_write )
			begin
				irq_in = irq_r & (~slave_writedata);
			end
		end

	end

	// Input signals for registers
	assign control_in 	= ( (slave_address == CONTROL_ADDR ) 	&& slave_write ) ? slave_writedata : (control_r & ~CONTROL_WS2812B_START_MASK);
	assign status_in        =   (status_r & ~STATUS_WS2812B_BUSY_MASK) | ( ws2812b_busy << STATUS_WS2812B_BUSY_BIT_NUM) ;
	assign im_in		= ( (slave_address == IM_ADDR ) 	&& slave_write ) ? slave_writedata : im_r;
	assign gpio_in		= gpio_inputs;
	assign gpio_out  	= ( (slave_address == GPIO_OUT_ADDR ) 	&& slave_write ) ? slave_writedata : gpio_out_r;
  assign chip_select_in  	= ( (slave_address == UNUSED_ADDR ) 	&& slave_write ) ? slave_writedata : chip_select_r;
	assign ws2812b_0_in  	= ( (slave_address == WS2818B_0_ADDR ) 	&& slave_write ) ? slave_writedata : ws2812b_0_r;
	assign ws2812b_1_in  	= ( (slave_address == WS2818B_1_ADDR ) 	&& slave_write ) ? slave_writedata : ws2812b_1_r;
	assign ws2812b_2_in  	= ( (slave_address == WS2818B_2_ADDR ) 	&& slave_write ) ? slave_writedata : ws2812b_2_r;
	assign ws2812b_3_in  	= ( (slave_address == WS2818B_3_ADDR ) 	&& slave_write ) ? slave_writedata : ws2812b_3_r;
	assign ws2812b_4_in  	= ( (slave_address == WS2818B_4_ADDR ) 	&& slave_write ) ? slave_writedata : ws2812b_4_r;
	assign ws2812b_5_in  	= ( (slave_address == WS2818B_5_ADDR ) 	&& slave_write ) ? slave_writedata : ws2812b_5_r;
	assign ws2812b_6_in  	= ( (slave_address == WS2818B_6_ADDR ) 	&& slave_write ) ? slave_writedata : ws2812b_6_r;
	assign ws2812b_7_in  	= ( (slave_address == WS2818B_7_ADDR ) 	&& slave_write ) ? slave_writedata : ws2812b_7_r;


	//*******************************************************************
	// Registers
	//*******************************************************************
	always @ (posedge clk or posedge reset)
	begin
		if (reset == 1)
		begin
		   	dev_id_r	<= 32'hECE45300;
			control_r	<= 32'h00000000;
			status_r	<= 32'h00000000;
			im_r		<= 32'h00000000;
			irq_r		<= 32'h00000000;
			gpio_in_r	<= 32'h00000000;
			gpio_out_r	<= 32'h00000000;
      chip_select_r <= 32'h00000000;
			ws2812b_0_r 	<= 32'h00000000;
			ws2812b_1_r	<= 32'h00000000;
			ws2812b_2_r	<= 32'h00000000;
			ws2812b_3_r	<= 32'h00000000;
			ws2812b_4_r	<= 32'h00000000;
			ws2812b_5_r	<= 32'h00000000;
			ws2812b_6_r	<= 32'h00000000;
			ws2812b_7_r	<= 32'h00000000;

		end
		else
		begin
		   	dev_id_r	<= 32'hECE45300;
			control_r	<= control_in;
			status_r	<= status_in;
			im_r 		<= im_in;
			irq_r 		<= irq_in;
			gpio_in_r	<= gpio_in;
			gpio_out_r	<= gpio_out;
      chip_select_r <= chip_select_in;
			ws2812b_0_r 	<= ws2812b_0_in;
			ws2812b_1_r 	<= ws2812b_1_in;
			ws2812b_2_r 	<= ws2812b_2_in;
			ws2812b_3_r 	<= ws2812b_3_in;
			ws2812b_4_r 	<= ws2812b_4_in;
			ws2812b_5_r 	<= ws2812b_5_in;
			ws2812b_6_r 	<= ws2812b_6_in;
			ws2812b_7_r 	<= ws2812b_7_in;
		end
	end

  spi_rotate rotator(
      .sclk(gpio_in_r[14]),
      .active(chip_select_r[2:0]),
      .adc_inputs(gpio_in_r[22:15]),
      .data(cs_out),
      .selected(receivers_out[7:0])
    );


endmodule

module spi_rotate (
  input sclk,
  input[2:0] active,
  input[7:0] adc_inputs,
  output data,
  output[7:0] selected
  );

  assign data = adc_inputs[active];
  assign selected = {sclk, sclk, sclk, sclk, sclk, sclk, sclk, sclk};

endmodule
