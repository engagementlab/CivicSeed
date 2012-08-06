function redirectToLogin(req, res) {
    if(req.url !== '/'){
        res.redirect('/login?redir=' + req.url);
    } else {
        res.redirect('/login');
    }
}

module.exports.requireRole = function (role) {
    return function(req, res, next) {
        if(req.session.user){
            if(req.session.user.role === role) { 
                next();
            } else {
                redirectToLogin(req, res);
            }
        } else {
            redirectToLogin(req, res);
        }
    };
};

module.exports.redirectIfLogined = function (req, res, next) {
    if(req.session.user){
        res.redirect('/');
    } else {
        next();
    }
}