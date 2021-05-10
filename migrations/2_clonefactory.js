const CloneFactory = artifacts.require("CloneFactory");

module.exports = async (deployer, network) => {
    deployer.deploy(CloneFactory);
};
