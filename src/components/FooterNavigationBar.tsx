import * as React from 'react';

import styles from './FooterNavigation.module.scss';
import { IFooterNavigationBO } from '../model/NavigationObject'
import { FooterLogoBO } from '../model/NavigationObject'
import { IFooterNavigationBarProps } from './IFooterNavigationBarProps';
import { IFooterNavigationBarState } from './IFooterNavigationBarState';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
 import { faAngleDoubleDown, faAngleDoubleUp } from '@fortawesome/free-solid-svg-icons';


import { CommandBar } from 'office-ui-fabric-react/lib/CommandBar';
import { IContextualMenuItem, ContextualMenuItemType } from 'office-ui-fabric-react/lib/ContextualMenu';

import { TopNavigationService } from './../service/TopNavigationService';
import { FooterNavigationService } from './../service/FooterNavigationService';

export default class TopNavigationBar extends React.Component<IFooterNavigationBarProps, IFooterNavigationBarState> {


  /** 
  * Main constructor for the component 
  */
 constructor(IFooterNavigationBarProps) {
  super(IFooterNavigationBarProps);
  this.state = {
    // toggle_status: "none",
    button: false
    //message: "Default Content"
  }
  this.handleClick = this.handleClick.bind(this);
}


  public render(): React.ReactElement<IFooterNavigationBarProps> {

//alert("hi exec.");
    const footerItems: IFooterNavigationBO[] = this.props.footerMenuItems;
    const footerLogoItem: FooterLogoBO = this.props.footerLogoItem;
    //var firstFooterLogo : FooterLogoBO = FooterLogoBO[0];
    var noOfCategories = footerItems.length;
    //console.log('no of categories' + noOfCategories);
    var lgParentDiv = 0;
    var lgInnerDIv = 0;
    var lgFooterLogoDiv = 0;

    if (noOfCategories == 1) {
      //console.log('inside category 1');
      lgParentDiv = 4;
      lgInnerDIv = 12;
      lgFooterLogoDiv = 8;
    }

    if (noOfCategories == 2) {
      //console.log('inside category 2');
      lgParentDiv = 6;
      lgInnerDIv = 6;
      lgFooterLogoDiv = 6;
    }

    if (noOfCategories == 3) {
      //console.log('inside category 3');
      lgParentDiv = 8;
      lgInnerDIv = 4;
      lgFooterLogoDiv = 4;
    }

    if (noOfCategories == 4) {
      //console.log('inside category 4');
      lgParentDiv = 10;
      lgInnerDIv = 3;
      lgFooterLogoDiv = 2;
    }
    var d = new Date();
    var n = d.getFullYear();
    return (
      <div data-id="menuPanel" className="ms-Grid" style={{ backgroundColor: "#E77C22", width: "100%", height: "auto" }}>
        <div className="container">
          <button className={this.state.button ? "buttonTrue toggleFooter": "buttonFalse toggleFooter"} onClick={this.handleClick}>
            <FontAwesomeIcon icon={this.state.button ? faAngleDoubleDown : faAngleDoubleUp }></FontAwesomeIcon>
          </button>  
        </div>
        <div className={"ms-Grid-row " + styles.customMSGridRow} data-footerBox={ this.state.button} style={{ marginLeft: "1%", marginBottom: "1%" }}>
          <div className={"ms-Grid-col ms-sm12 ms-md7 ms-lg" + lgParentDiv}>
            {
              footerItems.map((groupitem: IFooterNavigationBO) => {
                return <div data-id={`${groupitem.id}`} className={"ms-Grid-col ms-sm12 ms-md6 ms-lg" + lgInnerDIv} style={{ wordBreak: "true" }}>
                  <div className={styles.categoryItem}>
                    {groupitem.menuName}
                  </div>
                  {
                    groupitem.submenus.map((linkItem: IFooterNavigationBO) => {
                      var targetVal = linkItem.openInNewTab == true ? "_blank" : "_self";
                      return <div className={styles.footerMenuItem}>
                        <a href={linkItem.menuURL} target={targetVal} style={{ color: "white", textDecoration: "none" }}>{linkItem.menuName}</a>
                      </div>;
                    })
                  }
                </div>;
              })


            }

          </div >
          <div className={"ms-Grid-col ms-sm12 ms-md5 ms-lg" + lgFooterLogoDiv + " " + styles.footerLogo}>
            <a href={footerLogoItem.linkURL} target="_blank"> <img src={footerLogoItem.imagePath}  /> </a>
          </div>
        </div>
        <div className={"ms-Grid-row "} style={{color: "#fff",marginLeft: "1%"}}>
          <div className={"ms-Grid-col ms-sm11 ms-md11 ms-lg"} style={{padding: "5px"}}>
            &copy;Copyrights Reserved. ManpowerGroup {n}.
          </div>
        </div>
      </div>

    );
  }
  handleClick(){
    this.setState({
      button:!this.state.button
    })
  }
}
