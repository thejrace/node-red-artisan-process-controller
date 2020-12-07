const cp = require('child_process');

/**
 * ArtisanProcess constructor.
 */
function ArtisanProcess (props) {
    this.props = props;
    this.process = null;
    this.createdAt = Date.now() / 1000;

    this.spawnProcess();
}

/**
 * Spawns the artisan command.
 *
 * @return void
 */
ArtisanProcess.prototype.spawnProcess = function ()
{
    this.process = cp.spawn(
        'php',
        [this.props.artisanPath, this.props.artisanCommand, this.props.arguments],
        { stdio: ['pipe', process.stdout, process.stderr] });

    this.setUpProcessCallbacks();
};

/**
 * Sets up callbacks for process.
 *
 * @return void
 */
ArtisanProcess.prototype.setUpProcessCallbacks = function () {
    this.process.on('error', (err) => {
       console.log('ArtisanProcess spawn error.', { error: err});
    });

    this.process.on('close', (code, signal) => {
        console.log('ArtisanProcess killed.', {code: code, signal: signal});
    });
};

/**
 * Pipes data to process.
 *
 * @param data: string
 */
ArtisanProcess.prototype.pipeData = function (data) {
    this.process.stdin.write(data + '\n');
};

/**
 * Kills process.
 */
ArtisanProcess.prototype.kill = function () {
    this.process.stdin.end();
    this.process.kill();
};

/**
 * Returns whether process is expired or not.
 *
 * @return boolean
 */
ArtisanProcess.prototype.isExpired = function () {
    return (Date.now() / 1000) - this.createdAt > parseInt(this.props.processExpiresIn);
};

module.exports = ArtisanProcess;
