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
         * Active Artisan process.
         * @type {null|ArtisanProcess}
         */
        this.process = null;
        /**
         * New Artisan process used during transition.
         * @type {null|ArtisanProcess}
         */
        this.newProcess = null;
        /**
         * Redis topic process uses to publish.
         * @type {string}
         */
        this.activeTopic = '';
        /**
         * Process transition check flag for watcher.
         * @type {boolean}
         */
        this.transition = false;

        this.artisanConfig  = {
            artisanPath      : config.artisanPath,
            artisanCommand   : config.artisanCommand,
            processExpiresIn : config.expiresIn,
            tenant           : config.tenant,
        };

        this.spawnNewProcess();

        /**
         * Watcher for process checks.
         * @type {NodeJS.Timeout}
         */
        this.watcher = setInterval(() => {
            this.checkProcess();
        }, 5000);

        // Callback for incoming messages.
        this.on('input', () => {
            this.send({topic: this.activeTopic});
        });
    }

    /**
     * Checks whether current Artisan process is expired or not.
     *
     * @return void
     */
    ArtisanProcessController.prototype.checkProcess = function()
    {
        // If transition flag is set; it means previously
        // watcher attempted to spawn a new process.
        if (this.transition) {
            // Here we check if new process spawn attempt is
            // successful or not.
            if (this.newProcess.isSpawned()) {
                // New process is spawned, we move on
                // to kill old process.
                try {
                    console.log('kill old');
                    this.process.kill();
                } catch (err) {
                    console.log(err);
                    // This try-catch is used to suppress errors
                    // on initial start where this.process is null.
                }
                // Update topic name with the new one.
                this.activeTopic = this.newProcess.getTopicName();
                // Replace active process with new one.
                this.process = this.newProcess;
                this.newProcess = null;
                // Clear transition flag.
                this.transition = false;
                console.log('APC Transition completed.');
            }
            // Do not continue after this.
            return;
        }

        // When there is no transition, we check active
        // process for expiration.
        if (this.process.isExpired()) {
            console.log('APC process expired.');
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
        console.log('APC spawn new process.', {config: this.artisanConfig});
        this.transition = true;
        this.newProcess = new ArtisanProcess(this.artisanConfig);
        this.newProcess.spawn();
    };

    RED.nodes.registerType('artisan-process-controller', ArtisanProcessController);
};
