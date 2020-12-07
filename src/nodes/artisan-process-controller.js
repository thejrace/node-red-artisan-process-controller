const ArtisanProcess = require('../ArtisanProcess');

module.exports = function (RED) {

    /**
     * ArtisanProcessController constructor.
     */
    function ArtisanProcessController (config)
    {
        "use strict";
        RED.nodes.createNode(this, config);

        /**
         * @var null|ArtisanProcess
         */
        this.artisanProcess = null;
        this.artisanConfig  = {
            artisanPath      : config.artisanPath,
            artisanCommand   : config.artisanCommand,
            processExpiresIn : config.expiresIn,
            arguments        : config.arguments,
        };

        // Callback for incoming messages.
        this.on('input', (msg) => {
            this.handleInput(msg);
        });

    }

    /**
     * Handles input message.
     *
     * @return void
     */
    ArtisanProcessController.prototype.handleInput = function(msg)
    {
        if (!this.isProcessSpawned()) {
            this.spawnNewProcess();
        } else {
            if (this.artisanProcess.isExpired()) {
                this.artisanProcess.kill();
                this.spawnNewProcess();
            }
        }

        this.artisanProcess.pipeData(msg.payload);

        this.send(msg);
    }

    /**
     * Checks whether we have a spawned artisan process.
     *
     * @return boolean
     */
    ArtisanProcessController.prototype.isProcessSpawned = function()
    {
        return this.artisanProcess !== null;
    }

    /**
     * Spawns a new artisan command.
     *
     * @return void
     */
    ArtisanProcessController.prototype.spawnNewProcess = function()
    {
        this.artisanProcess = new ArtisanProcess(this.artisanConfig);
    }

    RED.nodes.registerType('artisan-process-controller', ArtisanProcessController);
};
