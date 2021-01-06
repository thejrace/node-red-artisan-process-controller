const cp = require('child_process');

/**
 * ArtisanProcess constructor.
 */
function ArtisanProcess (props)
{
    /**
     * Process props.
     * @type {object}
     */
    this.props = props;
    /**
     * Redis topic for the process.
     * @type {string}
     */
    this.topic = '';
    /**
     * Message expected from Artisan process to indicate it's spawned successfully.
     * @type {string}
     */
    this.spawnMessage = 'spawned';
    /**
     * Process instance.
     * @type {null|ChildProcess}
     */
    this.process = null;
    /**
     * Creation timestamp of the process. ( Unix stamp in seconds )
     * @type {number}
     */
    this.createdAt = Date.now() / 1000;
    /**
     * Spawned flag.
     * @type {boolean}
     */
    this.spawned = false;
    /**
     * Killed flag.
     * @type {boolean}
     */
    this.killed = false;
}

/**
 * Spawns the artisan command.
 *
 * @return void
 */
ArtisanProcess.prototype.spawn = function()
{
    this.createdAt = Date.now() / 1000;
    this.topic     = this.props.tenant + '_' + Date.now();

    try {
        this.process = cp.spawn(
            'php',
            [this.props.artisanPath, this.props.artisanCommand, this.props.tenant, this.topic]);

        this.setUpProcessCallbacks();
    } catch( error ) {
        console.log('ArtisanProcess spawn error!!!.', {props: this.props});
    }
};

/**
 * Sets up callbacks for process.
 *
 * @return void
 */
ArtisanProcess.prototype.setUpProcessCallbacks = function()
{
    // When Artisan process is spawned, we expect a message
    // from it to understand it's spawned with no problems.
    this.process.stdout.on('data', (message) => {
        if (message.toString() === this.spawnMessage) {
            this.spawned = true;
        }
    });

    this.process.on('error', (err) => {
        console.log('ArtisanProcess spawn error.', {tenant: this.props.tenant, error: err});
        this.killed = true;
    });

    this.process.on('close', (code, signal) => {
        console.log('ArtisanProcess killed.', {tenant: this.props.tenant, code: code, signal: signal});
        this.killed = true;
    });
};



/**
 * Kills process.
 */
ArtisanProcess.prototype.kill = function()
{
    try {
        this.process.stdin.end();
        this.process.kill();
    } catch(error) {
        console.log('ArtisanProcess kill error.', {tenant: this.props.tenant});
    }
};

/**
 * Returns whether process is expired or not.
 *
 * @return boolean
 */
ArtisanProcess.prototype.isExpired = function()
{
    return (Date.now() / 1000) - this.createdAt > parseInt(this.props.processExpiresIn);
};

/**
 * Returns whether process is spawned or not.
 *
 * @returns {boolean}
 */
ArtisanProcess.prototype.isSpawned = function()
{
    return this.spawned;
};

/**
 * Returns Redis topic name.
 *
 * @returns {string}
 */
ArtisanProcess.prototype.getTopicName = function()
{
    return this.topic;
};

module.exports = ArtisanProcess;
