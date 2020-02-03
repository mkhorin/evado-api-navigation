/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('evado/component/base/BaseController');

module.exports = class BaseController extends Base {

    constructor (config) {
        super(config);
        this.navMeta = this.module.getMeta('navigation');
    }

    createMetaSecurity (config) {
        return this.spawn('meta/MetaSecurity', {controller: this, ...config});
    }
};