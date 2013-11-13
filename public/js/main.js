var app = {
            video: null,
            canvas: null,
            localMediaStream: null,
            ctx: null,            
            imageData: null,
            prevImageData: null,
            size: 5,
            blurAmount: 0,
            startPoint: (Math.PI/180)*0,
            endPoint: (Math.PI/180)*360,
            colourToggle: true,
            isRecoring: false,
            recordRTC: null,
            mode: 'video',
            typeVisualization: 'dot',

            initialize: function(){         
               this.imageData= this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
               this.prevImageData= this.ctx.getImageData(0,0,this.canvas.width,this.canvas.height);
            },
            
            onCameraFail: function (e) {
                    console.log('Camera did not work.', e);
            },


            toggleColours: function () {
                colourToggle = !colourToggle;
            },

            getPixel2: function (x, y) {
                //
                var cr, cg, cb, ca, pr, pg, pb, pa, offset = x * 4 + y * 4 * this.imageData.width;
                cr = this.imageData.data[offset];
                cg = this.imageData.data[offset + 1];
                cb = this.imageData.data[offset + 2];
                ca = this.imageData.data[offset + 3];
                //
                pr = this.prevImageData.data[offset];
                pg = this.prevImageData.data[offset + 1];
                pb = this.prevImageData.data[offset + 2];
                pa = this.prevImageData.data[offset + 3];
                //
                var diff = Math.abs(pr-cr) + Math.abs(pg-cg) + Math.abs(pb-cb);
                var obj = new Object();
                if(diff > 50) {
                    obj.r = cr;
                    obj.g = cg;
                     obj.b = cb;
                } else {
                    obj.r = 555;
                    obj.g = 555;
                    obj.b = 555;
                }
                obj.d = diff;
                //
                return obj;
            },

             motionDetect: function () {
                this.imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
                this.ctx.clearRect(0,0,this.canvas.width, this.canvas.height);
                var x, y;
                for(x = 0; x < this.canvas.width; x += this.size) {
                    for(y = 0; y < this.canvas.height; y += this.size) {
                    
                       var cob = this.getPixel2( x, y);
          
                        if(cob.g < 555) {
                            this.ctx.fillStyle = "rgba(" + cob.r + "," + cob.g + "," + cob.b + "," + 255 + ")";
                            this.ctx.strokeStyle = "rgba(" + cob.r + "," + cob.g + "," + cob.b + "," + 255 + ")";
                            this.ctx.beginPath();
                            switch(this.typeVisualization){
                                case 'dot':
                                    this.ctx.arc(x,y,cob.d/10, this.startPoint, this.endPoint,true);
                                    this.ctx.fill();
                                break;
                                case 'line':
                                     this.ctx.moveTo(x, y);
                                     this.ctx.lineTo(x+cob.d, y+cob.d);
                                     this.ctx.stroke();
                                break;
                                case 'plane':
                                      this.ctx.rect(x, y, x * cob.d/100, y * cob.d/100);
                                      this.ctx.fill();
                                break;
                            }
                            
                            this.ctx.closePath();
                        }
                        
                    }
                }
                // update previous frame image data
                this.prevImageData = this.imageData;
            },

            drawVideoAtCanvas: function () {             
                // draw video image to canvas
                this.ctx.drawImage(this.video, 0, 0);
                this.motionDetect();
            },

            audio: function(context){
                var microphone = context.createMediaStreamSource(app.localMediaStream);
                var filter = context.createBiquadFilter();
                var compressor = context.createDynamicsCompressor();
                var reverb = context.createConvolver();
                var delay = context.createDelay();

               
                // microphone -> filter -> destination.
                microphone.connect(filter);
                microphone.connect(delay);
                microphone.connect(compressor);
                microphone.connect(reverb);

                filter.connect(context.destination);
                compressor.connect(context.destination);
                reverb.connect(context.destination);
                delay.connect(context.destination);       

            },

            render: function(){
                    this.drawVideoAtCanvas();
                    var self = this; 
                    // Render every 10 ms
                    setTimeout(function () {
                        self.render();
                      }, 30);
            },
            /* ---------------------------------------------
                                  Events
            ------------------------------------------------ */

            recordEventHanler: function(e){
                e.preventDefault();
                if(app.mode==='video'){
                    if(!this.isRecording){
                        this.isRecording=true;
                        $('#record').addClass('btn-stop-record');
                        app.recorder.start();
                        $('#record-timer').show();
                        // Listen for duration changes
                        app.recorder.addDurationListener(function(duration) {              
                            var xdate=new XDate(duration);
                            $('#record-timer').html(xdate.toString('m:ss'));
                        });
                       
                    }else{
                        this.isRecording=false;
                        $('#record').removeClass('btn-stop-record').hide();
                        $('#rendering-img').show();
                        app.recorder.stop();
                        app.recorder.render();
                        // Listen for rendering progress changes
                        app.recorder.addRenderProgressListener(function(progress) {
                            console.log('render: '+progress);
                            $('#record-timer').html(progress+'%');
                            if(progress==100){
                                $('#vid').attr('src', app.recorder.getDownloadURL());
                                console.log(app.recorder.getDownloadURL());
                                $('#canvas').hide();
                                $('.record-container').hide();
                                $('.btn-download').attr("href", app.recorder.getDownloadURL());
                                $('#vid').show();
                                $('#video-panel').show();
                                $('#vid')[0].load();
                                $('#vid')[0].play();

                            }
                        });
                    }
                }else{
                    
                }
            }

        }


$(document).ready(function(){
    /* User Media initialization */
        var video = document.querySelector("#vid");
        var canvas = document.querySelector('#canvas');
        navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
        window.URL = window.URL || window.webkitURL;
        navigator.getUserMedia({/*audio: true,*/video:true}, function (stream) {
            /* VIDEO */
            video.src = window.URL.createObjectURL(stream);
            app.video = video;
            app.canvas = canvas;
            app.ctx = canvas.getContext('2d');   
            app.localMediaStream = stream;
            app.initialize();
            app.recorder = new CanvasCapture(canvas);
            /* AUDIO */
            //var context = new webkitAudioContext();
            //app.audio(context);
        }, app.onCameraFail);
        

    /* Events delegation */   
        video.addEventListener('play', function() { 
                 app.render();
        }, false);

        $('#record').click(app.recordEventHanler);

        $('#btn-config').click(function(e){
            e.preventDefault();
            $('.menu-config').toggle();
        });

        $('#btn-dot').click(function(e){
            e.preventDefault();
            app.typeVisualization='dot';
        });
        $('#btn-line').click(function(e){
            e.preventDefault();
            app.typeVisualization='line';
        });
        $('#btn-plane').click(function(e){
            e.preventDefault();
            app.typeVisualization='plane';
        });

         $('#video-select').click(function(){
            app.mode='video';
            $('#video-select').addClass('selected');
            $('#photo-select').removeClass('selected');
        });
        $('#photo-select').click(function(){
            app.mode='photo';
            $('#photo-select').addClass('selected');
            $('#video-select').removeClass('selected');
        });


        // Event listener for the play/pause button
        $('#play-pause').click( function() {
          if (app.video.paused == true) {
            app.video.play();
            $('#play-pause').html("Pause").removeClass('btn-play').addClass('btn-pause');

          } else {
            app.video.pause();
            $('#play-pause').html("Play").removeClass('btn-pause').addClass('btn-play');
          }
        });

        var seekBar = document.getElementById("seek-bar");

        // Event listener for the seek bar
        seekBar.addEventListener("change", function() {
          // Calculate the new time
          var time = video.duration * (seekBar.value / 100);

          // Update the video time
          video.currentTime = time;
        });

        // Update the seek bar as the video plays
        video.addEventListener("timeupdate", function() {
          // Calculate the slider value
          var value = (100 / video.duration) * video.currentTime;

          // Update the slider value
          seekBar.value = value;
        });


        // Pause the video when the slider handle is being dragged
        seekBar.addEventListener("mousedown", function() {
          video.pause();
           $('#play-pause').html("Play").removeClass('btn-pause').addClass('btn-play');
          
        });

        // Play the video when the slider handle is dropped
        seekBar.addEventListener("mouseup", function() {
          video.play();
          $('#play-pause').html("Pause").removeClass('btn-play').addClass('btn-pause');
        });

    

});

    
    


    
