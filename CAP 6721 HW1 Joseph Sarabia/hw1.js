/*
	Joseph Sarabia
	CAP 6721
	Homework 1
	1/13/14
*/

function main(){
	var cl = WebCL.createContext ();
	var device = cl.getInfo(WebCL.CL_CONTEXT_DEVICES)[0];
	var cmdQueue = cl.createCommandQueue (device, 0);
	var programSrc = loadKernel("mandelbrot");
	var program = cl.createProgram(programSrc);
	try {
		program.build ([device], "");
	} catch(e) {
		alert ("Failed to build WebCL program. Error "
		   + program.getBuildInfo (device, WebCL.CL_PROGRAM_BUILD_STATUS)
		   + ":  " + program.getBuildInfo (device, WebCL.CL_PROGRAM_BUILD_LOG));
		throw e;
	}
	var kernelName = "mandelbrot";
	try {
		kernel = program.createKernel (kernelName);
	} catch(e){
		alert("No kernel with name:"+ kernelName+" is found.");
		throw e;
	}
	var canvas = document.getElementById("canvas")
	var width=canvas.width, height=canvas.height;
	var canvasContext=canvas.getContext("2d");
	var canvasContent = canvasContext.createImageData(width,height);
	var nPixels = width*height;
	var nChannels = 4;
	var pixelBufferSize = nChannels*nPixels;
	var pixelBuffer = cl.createBuffer(WebCL.CL_MEM_WRITE_ONLY,pixelBufferSize);
	kernel.setKernelArg(0,pixelBuffer);
	kernel.setKernelArg(1,width,WebCL.types.UINT);
	kernel.setKernelArg(2,height,WebCL.types.UINT);
	var dim = 2;
	var maxWorkElements = kernel.getWorkGroupInfo(device,webCL.KERNEL_WORK_GROUP_SIZE);// WorkElements in ComputeUnit
	var xSize = Math.floor(Math.sqrt(maxWorkElements));
	var ySize = Math.floor(maxWorkElements/xSize);
	var localWS = [xSize, ySize];
	var globalWS = [Math.ceil(width/xSize)*xSize, Math.ceil(height/ySize)*ySize];
	cmdQueue.enqueueNDRangeKernel(kernel,globalWS.length,[],globalWS,localWS,[]);
	// Must be done by pushing a Read request to the command queue
	cmdQueue.enqueueReadBuffer(pixelBuffer,false,0,pixelBufferSize,canvasContent.data,[]);
	cmdQueue.finish();
	canvasContext.putImageData(canvasContent,0,0);
	pixelBuffer.release();
	cmdQueue.release();
	kernel.release();
	program.release();
	cl.release();
}

function loadKernel(id){
  var kernelElement = document.getElementById(id);
  console.log(document.getElementById(id));
  var kernelSource = kernelElement.text;
  if (kernelElement.src != "") {
      var mHttpReq = new XMLHttpRequest();
      mHttpReq.open("GET", kernelElement.src, false);
      mHttpReq.send(null);
      kernelSource = mHttpReq.responseText;
  } 
  return kernelSource;
}