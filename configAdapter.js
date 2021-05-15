const { KOVAN_CONFIG } = require("./contracts/config/kovan-config");
const { BSCTEST_CONFIG } = require("./contracts/config/bsctest-config");


exports.GetConfig = function (network, accounts) {
    var CONFIG = {}
    switch (network) {
        case "kovan":
            CONFIG = KOVAN_CONFIG
            break;
        case "bsctest":
            CONFIG = BSCTEST_CONFIG
            break;
    }
    return CONFIG
}