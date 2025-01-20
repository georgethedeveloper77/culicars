import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:remixicon/remixicon.dart';

import '../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../config/ps_config.dart';
import '../../../../config/route/route_paths.dart';
import '../../../../core/vendor/provider/category/category_provider.dart';
import '../../../../core/vendor/utils/utils.dart';
import '../../../../core/vendor/viewobject/common/ps_value_holder.dart';
import '../../../../core/vendor/viewobject/holder/category_parameter_holder.dart';
import '../../../../core/vendor/viewobject/holder/request_path_holder.dart';
import '../../../../core/vendor/viewobject/holder/widget_provider_dyanmic.dart';
import '../../../custom_ui/category/component/menu_vertical/widgets/category_sort_widget.dart';
import '../../common/ps_admob_banner_widget.dart';
import '../../common/ps_app_bar_widget.dart';
import '../../sort_widget/ps_dynamic_provider.dart';
import '../../sort_widget/ps_dynamic_widget.dart';

class CategoryHomeBottomListView extends StatefulWidget {
  const CategoryHomeBottomListView({
    Key? key,
    required this.scaffoldKey,
  }) : super(key: key);

  final GlobalKey<ScaffoldState> scaffoldKey;
  @override
  _CategoryListViewState createState() {
    return _CategoryListViewState();
  }
}

class _CategoryListViewState extends State<CategoryHomeBottomListView>
    with TickerProviderStateMixin {
  final ScrollController _scrollController = ScrollController();

  CategoryProvider? _categoryProvider;
  final CategoryParameterHolder categoryParameterHolder =
      CategoryParameterHolder();

  AnimationController? animationController;
  Animation<double>? animation;
  bool isFirstTime = true;
  WidgetProviderDynamic? widgetProviderDynamic = WidgetProviderDynamic(
      providerList: <String>[''], widgetList: <String>['']);
  @override
  void dispose() {
    animationController!.dispose();
    animation = null;
    super.dispose();
  }

  @override
  void initState() {
    _scrollController.addListener(() {
      if (_scrollController.position.pixels ==
          _scrollController.position.maxScrollExtent) {
        _categoryProvider!.loadNextDataList();
      }
    });

    animationController =
        AnimationController(duration: PsConfig.animation_duration, vsync: this);

    super.initState();
  }

  PsValueHolder? psValueHolder;
  dynamic data;
  bool isConnectedToInternet = false;
  bool isSuccessfullyLoaded = true;

  void checkConnection() {
    Utils.checkInternetConnectivity().then((bool onValue) {
      isConnectedToInternet = onValue;
      if (isConnectedToInternet && psValueHolder!.isShowAdmob!) {
        setState(() {});
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    psValueHolder = Provider.of<PsValueHolder>(context);

    if (!isConnectedToInternet && psValueHolder!.isShowAdmob!) {
      print('loading ads....');
      checkConnection();
    }

    print(
        '............................Build UI Again ............................');
    // return WillPopScope(
    //   onWillPop: _requestPop,
    //   child: PsWidgetWithAppBarNoAppBarTitle<CategoryProvider>(
    //       initProvider: () {
    //     return CategoryProvider(repo: repo1);
    //   }, onProviderReady: (CategoryProvider provider) {
    //     provider.loadDataList(
    //         requestBodyHolder: provider.categoryParameterHolder,
    //         requestPathHolder: RequestPathHolder(
    //             loginUserId: Utils.checkUserLoginId(psValueHolder!)));
    //     _categoryProvider = provider;
    //   }, builder:
    //           (BuildContext context, CategoryProvider provider, Widget? child) {
    //     return Column(
    //       children: <Widget>[
    //         const PsAdMobBannerWidget(),
    //         CustomCategorySortWidget(),
    //         CustomCategoryVerticalListView(
    //             animationController: animationController!)
    //       ],
    //     );
    //   }),
    // );

    final WidgetProviderDynamic widgetprovider =
        Utils.psWidgetToProvider(PsConfig.categoryVerticalList);
    widgetProviderDynamic!.widgetList!.addAll(widgetprovider.widgetList!);
    widgetProviderDynamic!.providerList!.addAll(widgetprovider.providerList!);

    if (isFirstTime) {
      widgetProviderDynamic!.widgetList!.add('sizedbox_80');

      isFirstTime = false;
    }
    widgetProviderDynamic!.widgetList =
        widgetProviderDynamic!.widgetList!.toSet().toList();

    return MultiProvider(
      providers: psDynamicProvider(context, (Function fn) {},
          providerList: widgetProviderDynamic!.providerList!,
          mounted: mounted, categoryProvider: (CategoryProvider pro) {
        _categoryProvider = pro;
      }, keyword: ''),
      child: Container(
        margin: EdgeInsets.only(
            top: MediaQuery.of(widget.scaffoldKey.currentContext ?? context)
                .viewPadding
                .top),
        child: Scaffold(
          appBar: PsAppbarWidget(
            appBarTitle: 'category_search_list__app_bar_name'.tr,
            leading: Center(
                child: IconButton(
              icon: Icon(Icons.menu, color: Theme.of(context).primaryColor),
              onPressed: () => widget.scaffoldKey.currentState?.openDrawer(),
            )),
            actionWidgets: <Widget>[
              IconButton(
                icon: Icon(
                  Remix.search_line,
                  color: Theme.of(context).primaryColor,
                ),
                onPressed: () async {
                  final dynamic result = await Navigator.pushNamed(
                      context, RoutePaths.serachCategoryHistoryList,
                      arguments: _categoryProvider!.categoryParameterHolder);

                  if (result != null) {
                    _categoryProvider!.categoryParameterHolder = result;
                    _categoryProvider!.loadDataList(
                        reset: true,
                        requestBodyHolder:
                            _categoryProvider!.categoryParameterHolder,
                        requestPathHolder: RequestPathHolder(
                            loginUserId: Utils.checkUserLoginId(psValueHolder!),
                            languageCode: psValueHolder!.languageCode));

                    // searchBar.beginSearch(context);
                  }
                },
              ),
            ],
          ),
          body: Column(
            children: <Widget>[
              const PsAdMobBannerWidget(),
              CustomCategorySortWidget(),
              Expanded(
                child: PsDynamicWidget(
                  animationController: animationController!,
                  scrollController: _scrollController,
                  widgetList: widgetProviderDynamic!.widgetList,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
