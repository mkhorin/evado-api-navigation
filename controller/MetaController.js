/**
 * @copyright Copyright (c) 2020 Maxim Khorin <maksimovichu@gmail.com>
 */
'use strict';

const Base = require('../component/BaseController');

module.exports = class MetaController extends Base {

    static getConstants () {
        return {
            METHODS: {
                '*': 'post'
            },
            NAV_SEARCH_MIN: 2,
            NAV_SEARCH_MAX: 32
        };
    }

    async actionSection () {
        const section = this.navMeta.getSection(this.getPostParam('id'));
        if (!section) {
            throw new NotFound('Navigation section not found');
        }
        const nodes = await this.resolveNodes(section.children, section);
        this.sendJson({
            name: section.name,
            label: section.label,
            nodes
        });
    }

    async actionNode () {
        const node = this.navMeta.getNode(this.getPostParam('id'));
        if (!node) {
            throw new NotFound('Navigation node not found');
        }
        const children = await this.resolveNodes(node.children, node.section);
        this.sendJson({children});
    }

    actionListSectionSelect () {
        this.sendJson(MetaSelectHelper.getLabelItems(this.navMeta.sections.values()));
    }

    actionListNodeSelect () {
        const section = this.navMeta.getSection(this.getPostParam('section'));
        if (!section) {
            throw new NotFound('Navigation section not found');
        }
        const items = section.nodes.filter(item => !item.system);
        this.sendJson(MetaSelectHelper.getLabelItems(items));
    }

    async actionSearch () {
        const params = this.getPostParams();
        const section = this.navMeta.getSection(params.section);
        if (!section) {
            throw new NotFound('Navigation section not found');
        }
        const value = params.search;
        if (!this.validateNavSearch(value)) {
            throw new BadRequest('Invalid search value');
        }
        const nodes = section.search(value);
        nodes.length
            ? this.sendJson(await this.resolveNodes(nodes, section))
            : this.send();
    }

    async resolveNodes (items, section) {
        const rbac = this.module.getRbac();
        const forbidden = await rbac.resolveNavAccess(this.user.assignments, {items, section}, {
            controller: this,
            withParents: true
        });
        if (forbidden[section.id] === true) {
            return [];
        }
        const dynamic = await section.getDynamicNodes(items, {controller: this});
        const nodes = [];
        for (const item of items) {
            if (forbidden[item.id] === true) {
                // skip forbidden item
            } else if (Array.isArray(dynamic[item.id])) {
                this.setDynamicNodes(dynamic[item.id], nodes);
            } else {
                nodes.push(this.getNodeData(item));
            }
        }
        return nodes;
    }

    setDynamicNodes (items, result) {
        for (const item of items) {
            result.push(Object.assign(this.getNodeData(item), {
               objectId: item.objectId,
               urlParams: item.serializeUrlParams()
            }));
        }
    }

    getNodeData (node) {
        return {
            name: node.name,
            label: node.label,
            children: !!node.children,
            options: node.options,
            class: node.data.class,
            view: node.data.view,
            report: node.data.report,
            url: node.data.url,
            system: node.system
        };
    }

    validateNavSearch (value) {
        return typeof value === 'string'
            && value.length >= this.NAV_SEARCH_MIN
            && value.length <= this.NAV_SEARCH_MAX;
    }
};
module.exports.init(module);

const BadRequest = require('areto/error/http/BadRequest');
const NotFound = require('areto/error/http/NotFound');
const MetaSelectHelper = require('../component/MetaSelectHelper');