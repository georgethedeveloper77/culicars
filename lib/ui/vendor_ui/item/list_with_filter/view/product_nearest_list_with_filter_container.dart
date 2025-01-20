import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:remixicon/remixicon.dart';

import '../../../../../../../../config/ps_colors.dart';
import '../../../../../../../../config/ps_config.dart';
import '../../../../../../../../core/vendor/provider/category/category_provider.dart';
import '../../../../../../../../core/vendor/viewobject/holder/widget_provider_dyanmic.dart';
import '../../../../../config/route/route_paths.dart';
import '../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../core/vendor/provider/product/search_product_provider.dart';
import '../../../../../core/vendor/utils/utils.dart';
import '../../../../../core/vendor/viewobject/common/ps_value_holder.dart';
import '../../../../../core/vendor/viewobject/holder/product_parameter_holder.dart';
import '../../../../../core/vendor/viewobject/holder/request_path_holder.dart';
import '../../../common/ps_ui_widget.dart';
import '../../../common/search_bar_view.dart';
import '../../../sort_widget/ps_dynamic_provider.dart';
import '../../../sort_widget/ps_dynamic_widget.dart';

class ProductNearestListWithFilterContainerView extends StatefulWidget {
  const ProductNearestListWithFilterContainerView({
    required this.productParameterHolder,
    required this.appBarTitle,
  });
  final ProductParameterHolder productParameterHolder;
  final String? appBarTitle;

  @override
  _ProductNearestListWithFilterContainerViewState createState() =>
      _ProductNearestListWithFilterContainerViewState();
}

class _ProductNearestListWithFilterContainerViewState
    extends State<ProductNearestListWithFilterContainerView>
    with TickerProviderStateMixin {
  _ProductNearestListWithFilterContainerViewState();

  AnimationController? animationController;
  late TextEditingController searchTextController = TextEditingController();
  late SearchBarView searchBar;
  PsValueHolder? valueHolder;
  late SearchProductProvider _searchProductProvider;

  late AppLocalization langProvider;
  late WidgetProviderDynamic widgetProviderDynamic;

  bool isGrid = true;

  @override
  void initState() {
    animationController =
        AnimationController(duration: PsConfig.animation_duration, vsync: this);

    super.initState();

    searchBar = SearchBarView(
        inBar: true,
        controller: searchTextController,
        buildDefaultAppBar: buildAppBar,
        setState: setState,
        onSubmitted: onSubmitted,
        onCleared: () {
          print('cleared');
        },
        closeOnSubmit: false,
        onClosed: () {
          widget.productParameterHolder.searchTerm = '';
          _searchProductProvider.loadDataList(reset: true);
        });
  }

  @override
  void dispose() {
    animationController!.dispose();
    super.dispose();
  }

  AppBar buildAppBar(BuildContext context) {
    searchTextController.clear();
    return AppBar(
      systemOverlayStyle: SystemUiOverlayStyle(
        statusBarIconBrightness: Utils.getBrightnessForAppBar(context),
      ),
      backgroundColor: Utils.isLightMode(context)
          ? PsColors.achromatic50
          : PsColors.achromatic800,
      iconTheme: Theme.of(context)
          .iconTheme
          .copyWith(color: Theme.of(context).primaryColor),
      title: Text(widget.appBarTitle ?? '',
          style: Theme.of(context)
              .textTheme
              .titleLarge
              ?.copyWith(fontWeight: FontWeight.bold)
              .copyWith(color: PsColors.text50)),
      actions: <Widget>[
        IconButton(
          icon: Icon(Remix.search_line,
              color: Theme.of(context).primaryColor, size: 24),
          onPressed: () async {
            final dynamic result = await Navigator.pushNamed(
                context, RoutePaths.serachItemHistoryList,
                arguments: _searchProductProvider.productParameterHolder);

            if (result != null) {
              _searchProductProvider.productParameterHolder = result;
              _searchProductProvider.loadDataList(
                reset: true,
                requestBodyHolder:
                    _searchProductProvider.productParameterHolder,
                requestPathHolder: RequestPathHolder(
                    loginUserId: valueHolder!.loginUserId,
                    languageCode: langProvider.currentLocale.languageCode),
              );
            }
            // searchBar.beginSearch(context);
          },
        ),
        if (isGrid)
          IconButton(
            padding: const EdgeInsets.only(right: PsDimens.space16),
            icon: Icon(Icons.grid_view,
                color: Theme.of(context).primaryColor, size: 20),
            onPressed: () async {
              setState(() {
                isGrid = false;
              });
            },
          )
        else
          IconButton(
            padding: const EdgeInsets.only(right: PsDimens.space16),
            icon: Icon(Icons.list,
                color: Theme.of(context).primaryColor, size: 28),
            onPressed: () async {
              setState(() {
                isGrid = true;
              });
            },
          ),
      ],
      elevation: 0,
    );
  }

  void onSubmitted(String value) {
    if (!_searchProductProvider.needReset) {
      _searchProductProvider.needReset = true;
    }
    widget.productParameterHolder.searchTerm = value;
    _searchProductProvider.loadDataList(reset: true);
  }

  void resetDataList() {
    widget.productParameterHolder.searchTerm = '';
    _searchProductProvider.loadDataList(reset: true);
  }

  Future<bool> _requestPop() {
    animationController!.reverse().then<dynamic>(
      (void data) {
        if (!mounted) {
          return Future<bool>.value(false);
        }
        Navigator.pop(context, false);
        return Future<bool>.value(true);
      },
    );
    return Future<bool>.value(false);
  }

  final ScrollController scrollController = ScrollController();

  @override
  Widget build(BuildContext context) {
    valueHolder = Provider.of<PsValueHolder>(context);

    langProvider = Provider.of<AppLocalization>(context);
    widgetProviderDynamic =
        Utils.psWidgetToProvider(PsConfig.productListWithFilterWidgetList);
    print(
        '............................Build UI Again ............................');
    animationController!.forward();
    return PopScope(
      canPop: false,
     onPopInvokedWithResult: (bool didPop, Object? dynamic) async {
        if (didPop) {
          return;
        }
        _requestPop();
      },
      child: MultiProvider(
        providers: psDynamicProvider(context, (Function f) {},
            categoryProvider: (CategoryProvider pro) {},
            mounted: mounted,
            providerList: widgetProviderDynamic.providerList!,
            // providerList: <String>[
            //       PsProviderConst.init_search_nearest_product_provider,
            //       // PsProviderConst.init_category_provider,
            //     ],
            searchProductProvider: (SearchProductProvider pro) {
          _searchProductProvider = pro;
        }, productParameterHolder: widget.productParameterHolder),
        child: Scaffold(
          appBar: searchBar.build(context),
          body: RefreshIndicator(
            onRefresh: () {
              return _searchProductProvider.loadDataList(
                reset: true,
                requestBodyHolder:
                    _searchProductProvider.productParameterHolder,
              );
            },
            child: Consumer<SearchProductProvider>(builder:
                (BuildContext context, SearchProductProvider pro,
                    Widget? child) {
              return Stack(
                children: <Widget>[
                  Container(
                    margin: const EdgeInsets.only(
                        left: PsDimens.space12,
                        right: PsDimens.space12,
                        bottom: PsDimens.space4),
                    child: PsDynamicWidget(
                      animationController: animationController!,
                      scrollController: scrollController,
                      widgetList: widgetProviderDynamic.widgetList,
                      isGrid: isGrid,
                    ),
                  ),
                  PSProgressIndicator(pro.currentStatus),
                ],
              );
            }),
          ),
        ),
      ),
    );
  }
}
