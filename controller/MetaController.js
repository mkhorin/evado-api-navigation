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
            }
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

    async resolveNodes (items, section) {
        const rbac = this.module.getRbac();
        const forbidden = await rbac.resolveNavAccess(this.user.assignments, {items, section});
        if (forbidden[section.id] === true) {
            return [];
        }
        const nodes = [];
        for (const node of items) {
            if (forbidden[node.id] !== true) {
                nodes.push(this.getNodeData(node));
            }
        }
        return nodes;
    }

    getNodeData (node) {
        return {
            name: node.name,
            label: node.data.label,
            children: !!node.children,
            options: node.options,
            class: node.data.class,
            view: node.data.view,
            report: node.data.report,
            url: node.data.url,
            system: node.system
        };
    }
};
module.exports.init(module);

const NotFound = require('areto/error/http/NotFound');
const MetaSelectHelper = require('../component/MetaSelectHelper');