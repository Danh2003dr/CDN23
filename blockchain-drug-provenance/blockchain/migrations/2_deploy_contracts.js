const DrugProvenance = artifacts.require("DrugProvenance");

module.exports = function (deployer) {
  deployer.deploy(DrugProvenance);
};