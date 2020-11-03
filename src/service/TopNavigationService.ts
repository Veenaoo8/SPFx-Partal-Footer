import { IWebPartContext } from '@microsoft/sp-webpart-base';
import { Environment, EnvironmentType } from '@microsoft/sp-core-library';
import { SPHttpClient, SPHttpClientResponse, ISPHttpClientOptions } from '@microsoft/sp-http';

import pnp from 'sp-pnp-js';
import { Web } from 'sp-pnp-js/lib/sharepoint/webs';
import { INavigationBO } from '../model/NavigationObject';
import { ErrorLogCreation } from '../errorlog/errorLogCreation';



export class TopNavigationService {

     public static readonly level1ListName: string = "TopMenuLevel1";
    public static readonly level2ListName: string = "TopMenuLevel2";
    public static readonly level3ListName: string = "TopMenuLevel3";

    // Get items for the menu and cache the result in session cache.
    public static getMenuItems(absSiteCollectionUrl: string, relSiteCollectionUrl: string): Promise<INavigationBO[]> {
        try {
            return new Promise<INavigationBO[]>((resolve, reject) => {

                // See if we've cached the result previously.
                var navItems: INavigationBO[];
                /**alert("Calling getMenuItemsFromSp");*/
                var level1ItemsPromise = TopNavigationService.getMenulevel1ItemsFromSp(TopNavigationService.level1ListName, absSiteCollectionUrl, relSiteCollectionUrl);
                var level2ItemsPromise = TopNavigationService.getMenulevel2ItemsFromSp(TopNavigationService.level2ListName, absSiteCollectionUrl, relSiteCollectionUrl);
                var level3ItemsPromise = TopNavigationService.getMenulevel3ItemsFromSp(TopNavigationService.level3ListName, absSiteCollectionUrl, relSiteCollectionUrl);

                Promise.all([level1ItemsPromise, level2ItemsPromise, level3ItemsPromise])
                    .then((results: any[][]) => {

                        navItems = TopNavigationService.convertItemsFromSp(results[0], results[1], results[2], absSiteCollectionUrl, relSiteCollectionUrl);
                        // Store in session cache.
                        //pnp.storage.session.put(TopNavigationService.cacheKey, navItems);

                        resolve(navItems);
                    }).catch((exception) => {
                        var methodName = "getMenuItems";
                        ErrorLogCreation.createErrorLogItem(absSiteCollectionUrl, relSiteCollectionUrl, exception, methodName)
                    });

            });
        }
        catch (exception) {
            var methodName = "getMenuItems";
            ErrorLogCreation.createErrorLogItem(absSiteCollectionUrl, relSiteCollectionUrl, exception, methodName);
        }
    }
    // Get raw results from SP.
    private static getMenulevel1ItemsFromSp(listName: string, absSiteCollectionUrl: string, relSiteCollectionUrl: string): Promise<any[]> {
        try {
            return new Promise<INavigationBO[]>((resolve, reject) => {

                let web = new Web(absSiteCollectionUrl);

                web.getList(relSiteCollectionUrl + '/Lists/' + listName)
                    .items
                    .select("Id,Title,MenuURL,SortOrder,OpenInNewTab")
                    .top(1000)
                    .filter("Show eq 1")
                    .orderBy("SortOrder")
                    .get()
                    .then((level1items: any[]) => {
                        resolve(level1items);
                    })
                    .catch((error: any) => {
                        var methodName = "getMenuItemsFromSp";
                        ErrorLogCreation.createErrorLogItem(absSiteCollectionUrl, relSiteCollectionUrl, error, methodName)
                    });

            });
        }
        catch (exception) {
            var methodName = "getMenuItemsFromSp";
            ErrorLogCreation.createErrorLogItem(absSiteCollectionUrl, relSiteCollectionUrl, exception, methodName);
        }

    }
    private static getMenulevel2ItemsFromSp(listName: string, absSiteCollectionUrl: string, relSiteCollectionUrl: string): Promise<any[]> {
        try {
            return new Promise<INavigationBO[]>((resolve, reject) => {

                let web = new Web(absSiteCollectionUrl);

                web.getList(relSiteCollectionUrl + '/Lists/' + listName)
                    .items
                    .select("Id,Level1ParentMenuId,Title,MenuURL,SortOrder,OpenInNewTab")
                    .top(1000)
                    .filter("Show eq 1")
                    .orderBy("SortOrder")
                    .get()
                    .then((level2items: any[]) => {
                        resolve(level2items);
                    })
                    .catch((error: any) => {
                        var methodName = "getMenuItemsFromSp";
                        ErrorLogCreation.createErrorLogItem(absSiteCollectionUrl, relSiteCollectionUrl, error, methodName)
                    });

            });
        }
        catch (exception) {
            var methodName = "getMenuItemsFromSp";
            ErrorLogCreation.createErrorLogItem(absSiteCollectionUrl, relSiteCollectionUrl, exception, methodName);
        }

    }
    private static getMenulevel3ItemsFromSp(listName: string, absSiteCollectionUrl: string, relSiteCollectionUrl: string): Promise<any[]> {
        try {
            return new Promise<INavigationBO[]>((resolve, reject) => {

                let web = new Web(absSiteCollectionUrl);

                web.getList(relSiteCollectionUrl + '/Lists/' + listName)
                    .items
                    .select("Id,Level2ParentMenuId,Title,MenuURL,SortOrder,OpenInNewTab")
                    .top(1000)
                    .filter("Show eq 1")
                    .orderBy("SortOrder")
                    .get()
                    .then((level3items: any[]) => {
                        resolve(level3items);
                    })
                    .catch((error: any) => {
                        var methodName = "getMenuItemsFromSp";
                        ErrorLogCreation.createErrorLogItem(absSiteCollectionUrl, relSiteCollectionUrl, error, methodName)
                    });

            });
        }
        catch (exception) {
            var methodName = "getMenuItemsFromSp";
            ErrorLogCreation.createErrorLogItem(absSiteCollectionUrl, relSiteCollectionUrl, exception, methodName);
        }

    }
    // Convert results from SP into actual entities with correct relationships.
    private static convertItemsFromSp(level1: any[], level2: any[], level3: any[], absSiteCollectionUrl, relSiteCollectionUrl): INavigationBO[] {
        try {
            var level1Dictionary: { [id: number]: INavigationBO; } = {};
            var level2Dictionary: { [id: number]: INavigationBO; } = {};

            // Convert level 1 items and store in dictionary.
            var level1Items: INavigationBO[] = level1.map((item: any) => {
                var newItem = {
                    id: item.Id,
                    parentId: null,
                    heading: item.Title,
                    menuURL: item.MenuURL ? item.MenuURL.Url : "",
                    sortOrder: item.SortOrder,
                    submenus: [],
                    openInNewTab: item.OpenInNewTab
                    // id: item.Id,
                    //heading: item.Title,
                    //men: []
                };

                level1Dictionary[newItem.id] = newItem;

                return newItem;
            });

            // Convert level 2 items and store in dictionary.
            var level2Items: INavigationBO[] = level2.map((item: any) => {
                var newItem = {

                    id: item.Id,
                    parentId: item.Level1ParentMenuId,
                    heading: item.Title,
                    menuURL: item.MenuURL ? item.MenuURL.Url : "",
                    sortOrder: item.SortOrder,
                    submenus: [],
                    openInNewTab: item.OpenInNewTab


                };

                level2Dictionary[newItem.id] = newItem;

                return newItem;
            });

            // Convert level 3 items and store in dictionary.
            var level3Items: INavigationBO[] = level3.map((item: any) => {
                return {
                    id: item.Id,
                    parentId: item.Level2ParentMenuId,
                    heading: item.Title,
                    menuURL: item.MenuURL ? item.MenuURL.Url : "",
                    sortOrder: item.SortOrder,
                    submenus: null,
                    openInNewTab: item.OpenInNewTab
                };
            });

            // Now link the entities into the desired structure.
            for (let l3 of level3Items) {
                if (level2Dictionary[l3.parentId] != undefined) {
                    level2Dictionary[l3.parentId].submenus.push(l3);
                }
            }

            for (let l2 of level2Items) {
                if (level1Dictionary[l2.parentId] != undefined) {
                    level1Dictionary[l2.parentId].submenus.push(l2);
                }
            }

            var retVal: INavigationBO[] = [];

            for (let l1 of level1Items) {
                retVal.push(l1);
            }

            return retVal;

        }

        catch (exception) {
            var methodName = "convertItemsFromSp";
            ErrorLogCreation.createErrorLogItem(absSiteCollectionUrl, relSiteCollectionUrl, exception, methodName);
        }
    }

} 
