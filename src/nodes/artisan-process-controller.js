const ArtisanProcess = require('../ArtisanProcess');

module.exports = function (RED) {

    /**
     * ArtisanProcessController constructor.
     */
    function ArtisanProcessController (config)
    {
        'use strict';
        RED.nodes.createNode(this, config);

        /**
         * @var null|ArtisanProcess
         */
        this.process             = null;
        this.notificationPool    = [];
        this.receivedNotfCounter = 0;
        this.pipedBatchCounter    = 0;
        this.batchCounter        = 0;
        this.batchSize           = 300;

        this.artisanConfig  = {
            artisanPath      : config.artisanPath,
            artisanCommand   : config.artisanCommand,
            processExpiresIn : config.expiresIn,
            arguments        : config.arguments,
        };

        this.spawnNewProcess();

        // Callback for incoming messages.
        this.on('input', (msg) => {
            this.receivedNotfCounter++;

            this.handleInput(JSON.stringify(msg.payload));

            // Output monitoring data.
            var piped = this.pipedBatchCounter * this.batchSize;
            this.send({
                received : this.receivedNotfCounter,
                piped    : piped,
                diff     : this.receivedNotfCounter - piped,
            });
        });
    }

    /**
     * Handles input message.
     *
     * @return void
     */
    ArtisanProcessController.prototype.handleInput = function (msg)
    {
        this.pushData(msg);
    };

    /**
     * Push data to notification pool.
     *
     * @param data: string
     *
     * @return void
     */
    ArtisanProcessController.prototype.pushData = function(data)
    {
        this.notificationPool.push(data);
        this.batchCounter++;

        if (this.batchCounter === this.batchSize) {
            this.checkProcess();

            this.pipe(this.notificationPool.slice(0));

            this.notificationPool = [];
            this.batchCounter     = 0;
            this.pipedBatchCounter++;
        }
    };

    /**
     * Pipes batch to process.
     *
     * @param batch: Array<string>
     */
    ArtisanProcessController.prototype.pipe = function(batch)
    {
        try {
            for (let k = 0; k < this.batchSize; k++) {
                this.process.pipeData(batch[k]);
            }
        } catch (error) {
            console.error('A.P.C pipe error.', {tenant: this.tenant.name});
        }
    };

    /**
     * Checks whether current Artisan process is expired or not.
     *
     * @return void
     */
    ArtisanProcessController.prototype.checkProcess = function()
    {
        if (this.process.isExpired()) {
            this.process.kill();

            this.spawnNewProcess();
        }
    };

    /**
     * Spawns a new artisan command.
     *
     * @return void
     */
    ArtisanProcessController.prototype.spawnNewProcess = function ()
    {
        this.process = new ArtisanProcess(this.artisanConfig);
    };

    RED.nodes.registerType('artisan-process-controller', ArtisanProcessController);
};
