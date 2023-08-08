const router = require ('express').Router ();

router.get ('/', function (req, res) {
    res.send ("Test API");
});



module.exports = router;

