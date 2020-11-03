import { IWebPartContext } from '@microsoft/sp-webpart-base';
import { Environment, EnvironmentType } from '@microsoft/sp-core-library';
import { SPHttpClient, SPHttpClientResponse, ISPHttpClientOptions } from '@microsoft/sp-http';

import pnp from 'sp-pnp-js';
import { Web } from 'sp-pnp-js/lib/sharepoint/webs';

import { IFooterNavigationBO } from '../model/NavigationObject';
import { FooterLogoBO } from '../model/NavigationObject';
import { ErrorLogCreation } from '../errorlog/errorLogCreation';

export class FooterNavigationService {

    public static readonly footerListName: string = "Footer Links";
    public static readonly footerImageLibName: string = "Footer Icons";    

    // Get items for the menu and cache the result in session cache.
    public static getFooterItems(absSiteCollectionUrl: string, relSiteCollectionUrl: string): Promise<IFooterNavigationBO[]> {
        try {

            return new Promise<IFooterNavigationBO[]>((resolve, reject) => {

                // See if we've cached the result previously.
                var navItems: IFooterNavigationBO[];

                /**alert("Calling getMenuItemsFromSp");*/
                var level1ItemsPromise = FooterNavigationService.getMenuItemsFromSp(FooterNavigationService.footerListName, 1, absSiteCollectionUrl, relSiteCollectionUrl);
                var level2ItemsPromise = FooterNavigationService.getMenuItemsFromSp(FooterNavigationService.footerListName, 2, absSiteCollectionUrl, relSiteCollectionUrl);


                Promise.all([level1ItemsPromise, level2ItemsPromise])
                    .then((results: any[][]) => {

                        navItems = FooterNavigationService.convertItemsFromSp(results[0], results[1], absSiteCollectionUrl, relSiteCollectionUrl);

                        // Store in session cache.
                        //pnp.storage.session.put(FooterNavigationService.cacheKey, navItems);

                        resolve(navItems);
                    });
            });

        }
        catch (exception) {
            var methodName = "getFooterItems";
            ErrorLogCreation.createErrorLogItem(absSiteCollectionUrl, relSiteCollectionUrl, exception, methodName);
        }
    }
    // Get raw results from SP.
    private static getFooterImageFromSp(listName: string, absSiteCollectionUrl: string, relSiteCollectionUrl: string): Promise<any> {
        try {
            return new Promise<FooterLogoBO>((resolve, reject) => {

                let web = new Web(absSiteCollectionUrl);

                // TODO : Note that passing in url and using this approach is a workaround. I would have liked to just
                // call pnp.sp.site.rootWeb.lists, however when running this code on SPO modern pages, the REST call ended
                // up with a corrupt URL. However it was OK on View All Site content pages, etc.

                web.getList(relSiteCollectionUrl + '/' + listName)
                    .items
                    .select("FileRef,ImageLink")
                    .get()
                    .then((items: any) => {
                        resolve(items);
                    })
                    .catch((error: any) => {
                        reject(error);
                    });


            });



        }
        catch (exception) {
            var methodName = "getFooterImageFromSp";
            ErrorLogCreation.createErrorLogItem(absSiteCollectionUrl, relSiteCollectionUrl, exception, methodName);
        }
    }
    public static getFooterLogoItem(absSiteCollectionUrl: string, relSiteCollectionUrl: string): Promise<FooterLogoBO> {
        try {
            return new Promise<FooterLogoBO>((resolve, reject) => {
                var footerLogoPromise = this.getFooterImageFromSp(this.footerImageLibName, absSiteCollectionUrl, relSiteCollectionUrl);
                var footerLogoObj = new FooterLogoBO;
                Promise.all([footerLogoPromise]).then((results: any) => {

                    if (results != undefined && results.length > 0) {
                        var firstArrItem = results[0];
                        if (firstArrItem != undefined && firstArrItem.length > 0) {
                            var firstImage = firstArrItem[0];
                            footerLogoObj.imagePath = firstImage.FileRef;
                            footerLogoObj.linkURL = firstImage.ImageLink ? firstImage.ImageLink.Url : "";
                        }

                    }
                    resolve(footerLogoObj);

                });

            });

        }
        catch (exception) {
            var methodName = "getFooterLogoItem";
            ErrorLogCreation.createErrorLogItem(absSiteCollectionUrl, relSiteCollectionUrl, exception, methodName);
        }

    }
    private static getMenuItemsFromSp(listName: string, level: number, absSiteCollectionUrl: string, relSiteCollectionUrl: string): Promise<any[]> {
        try {
            return new Promise<IFooterNavigationBO[]>((resolve, reject) => {

                let web = new Web(absSiteCollectionUrl);

                // TODO : Note that passing in url and using this approach is a workaround. I would have liked to just
                // call pnp.sp.site.rootWeb.lists, however when running this code on SPO modern pages, the REST call ended
                // up with a corrupt URL. However it was OK on View All Site content pages, etc.



                if (level == 1) {
                    web.getList(relSiteCollectionUrl + '/Lists/' + listName)
                        .items
                        .filter("ParentGroup eq null and Show eq 1")
                        .orderBy("SortOrder")
                        .get()
                        .then((items: any[]) => {
                            resolve(items);
                        })
                        .catch((error: any) => {
                            reject(error);
                        });
                }

                if (level == 2) {
                    web.getList(relSiteCollectionUrl + '/Lists/' + listName)
                        .items
                        .filter("ParentGroup ne null and Show eq 1")
                        .orderBy("SortOrder")
                        .get()
                        .then((items: any[]) => {
                            resolve(items);
                        })
                        .catch((error: any) => {
                            reject(error);
                        });
                }

                /*
                if(level == 1)
                {
                web.lists
                    .getByTitle(listName)
                    .items
                    .filter("ParentGroup eq null and Show eq 1")
                    .orderBy("SortOrder")
                    .get()
                    .then((items: any[]) => {
                        resolve(items);
                    })
                    .catch((error: any) => {
                        reject(error);
                    });
                }
                
                if(level == 2)
                {
                web.lists
                    .getByTitle(listName)
                    .items
                    .filter("ParentGroup ne null and Show eq 1")
                    .orderBy("SortOrder")
                    .get()
                    .then((items: any[]) => {
                        resolve(items);
                    })
                    .catch((error: any) => {
                        reject(error);
                    });
                }
                */
            });
        }
        catch (exception) {
            var methodName = "getMenuItemsFromSp";
            ErrorLogCreation.createErrorLogItem(absSiteCollectionUrl, relSiteCollectionUrl, exception, methodName);
        }
    }
    // Convert results from SP into actual entities with correct relationships.
    private static convertItemsFromSp(level1: any[], level2: any[], absSiteCollectionUrl, relSiteCollectionUrl): IFooterNavigationBO[] {

        try {

            var level1Dictionary: { [id: number]: IFooterNavigationBO; } = {};
            var level2Dictionary: { [id: number]: IFooterNavigationBO; } = {};

            // Convert level 1 items and store in dictionary.
            var level1Items: IFooterNavigationBO[] = level1.map((l1item: any) => {
                var newItem = {
                    id: l1item.Id,
                    parentGroupId: null,
                    menuName: l1item.Title,
                    menuURL: l1item.MenuURL ? l1item.MenuURL.Url : "",
                    sortOrder: l1item.SortOrder,
                    submenus: [],
                    openInNewTab: l1item.OpenInNewTab
                    // id: item.Id,
                    //heading: item.Title,
                    //men: []
                };

                level1Dictionary[newItem.id] = newItem;

                return newItem;
            });

            // Convert level 2 items and store in dictionary.
            var level2Items: IFooterNavigationBO[] = level2.map((l2item: any) => {
                var newItem = {

                    id: l2item.Id,
                    parentGroupId: l2item.ParentGroupId,
                    menuName: l2item.Title,
                    menuURL: l2item.MenuURL ? l2item.MenuURL.Url : "",
                    sortOrder: l2item.SortOrder,
                    submenus: null,
                    openInNewTab: l2item.OpenInNewTab


                };

                return newItem;
            });


            // Now link the entities into the desired structure.
            for (let l2 of level2Items) {
                if (level1Dictionary[l2.parentGroupId] != undefined) {
                    level1Dictionary[l2.parentGroupId].submenus.push(l2);
                }
            }

            var retVal: IFooterNavigationBO[] = [];

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
